import { useState, useMemo } from 'react';

/* ---------- types ---------- */
type Language = 'go' | 'typescript' | 'python' | 'java' | 'rust' | 'ruby' | 'dotnet';
type WorkflowType = 'chain' | 'group' | 'batch';

interface WorkflowStep {
  jobType: string;
  args: string;
  queue?: string;
}

interface WorkflowDef {
  type: WorkflowType;
  steps: WorkflowStep[];
  callbackType?: string;
}

interface ValidationError {
  step: number;
  field: string;
  message: string;
}

/* ---------- validation ---------- */
export function validateWorkflow(def: WorkflowDef): ValidationError[] {
  const errors: ValidationError[] = [];

  if (def.steps.length === 0) {
    errors.push({ step: -1, field: 'steps', message: 'Workflow must have at least one step' });
    return errors;
  }

  if (def.type === 'chain' && def.steps.length < 2) {
    errors.push({ step: -1, field: 'type', message: 'Chain workflows require at least 2 steps' });
  }

  if (def.type === 'batch' && !def.callbackType) {
    errors.push({ step: -1, field: 'callback', message: 'Batch workflows require an on_complete callback' });
  }

  const seenTypes = new Set<string>();
  def.steps.forEach((step, i) => {
    if (!step.jobType || step.jobType.trim() === '') {
      errors.push({ step: i, field: 'jobType', message: `Step ${i + 1}: job type is required` });
    } else if (!/^[a-z][a-z0-9_.]+$/.test(step.jobType)) {
      errors.push({ step: i, field: 'jobType', message: `Step ${i + 1}: invalid job type format (use lowercase with dots/underscores)` });
    }

    if (step.args) {
      try {
        JSON.parse(step.args);
      } catch {
        errors.push({ step: i, field: 'args', message: `Step ${i + 1}: args must be valid JSON` });
      }
    }

    if (def.type === 'group' && seenTypes.has(step.jobType)) {
      errors.push({ step: i, field: 'jobType', message: `Step ${i + 1}: duplicate job type in parallel group` });
    }
    seenTypes.add(step.jobType);
  });

  return errors;
}

/* ---------- code generators ---------- */
const generators: Record<Language, (def: WorkflowDef) => string> = {
  go: (def) => {
    const steps = def.steps.map((s) => {
      const args = s.args ? JSON.parse(s.args) : [];
      const argsStr = args.map((a: unknown) => JSON.stringify(a)).join(', ');
      return `ojs.Step("${s.jobType}", ${argsStr || '""'})`;
    });

    if (def.type === 'chain') {
      return `package main

import "github.com/openjobspec/ojs-go-sdk"

func main() {
\tclient := ojs.NewClient("http://localhost:8080")

\tworkflow := ojs.Chain(
\t\t${steps.join(',\n\t\t')},
\t)

\tid, err := client.EnqueueWorkflow(workflow)
\tif err != nil {
\t\tpanic(err)
\t}
\tfmt.Println("Workflow started:", id)
}`;
    }

    if (def.type === 'group') {
      return `package main

import "github.com/openjobspec/ojs-go-sdk"

func main() {
\tclient := ojs.NewClient("http://localhost:8080")

\tworkflow := ojs.Group(
\t\t${steps.join(',\n\t\t')},
\t)

\tid, err := client.EnqueueWorkflow(workflow)
\tif err != nil {
\t\tpanic(err)
\t}
\tfmt.Println("Workflow started:", id)
}`;
    }

    // batch
    return `package main

import "github.com/openjobspec/ojs-go-sdk"

func main() {
\tclient := ojs.NewClient("http://localhost:8080")

\tworkflow := ojs.Batch(
\t\t[]ojs.WorkflowStep{
\t\t\t${steps.join(',\n\t\t\t')},
\t\t},
\t\tojs.OnComplete("${def.callbackType || 'batch.callback'}"),
\t)

\tid, err := client.EnqueueWorkflow(workflow)
\tif err != nil {
\t\tpanic(err)
\t}
\tfmt.Println("Workflow started:", id)
}`;
  },

  typescript: (def) => {
    const steps = def.steps.map((s) => {
      const args = s.args ? JSON.parse(s.args) : [];
      return `{ type: '${s.jobType}', args: ${JSON.stringify(args)} }`;
    });

    if (def.type === 'chain') {
      return `import { OJSClient } from '@openjobspec/sdk';

const client = new OJSClient({ url: 'http://localhost:8080' });

const workflow = client.chain([
  ${steps.join(',\n  ')},
]);

const id = await client.enqueueWorkflow(workflow);
console.log('Workflow started:', id);`;
    }

    if (def.type === 'group') {
      return `import { OJSClient } from '@openjobspec/sdk';

const client = new OJSClient({ url: 'http://localhost:8080' });

const workflow = client.group([
  ${steps.join(',\n  ')},
]);

const id = await client.enqueueWorkflow(workflow);
console.log('Workflow started:', id);`;
    }

    return `import { OJSClient } from '@openjobspec/sdk';

const client = new OJSClient({ url: 'http://localhost:8080' });

const workflow = client.batch(
  [
    ${steps.join(',\n    ')},
  ],
  { onComplete: { type: '${def.callbackType || 'batch.callback'}', args: [] } }
);

const id = await client.enqueueWorkflow(workflow);
console.log('Workflow started:', id);`;
  },

  python: (def) => {
    const steps = def.steps.map((s) => {
      const args = s.args ? JSON.parse(s.args) : [];
      return `Step("${s.jobType}", args=${JSON.stringify(args)})`;
    });

    if (def.type === 'chain') {
      return `from openjobspec import OJSClient, Chain, Step

client = OJSClient(url="http://localhost:8080")

workflow = Chain([
    ${steps.join(',\n    ')},
])

job_id = await client.enqueue_workflow(workflow)
print(f"Workflow started: {job_id}")`;
    }

    if (def.type === 'group') {
      return `from openjobspec import OJSClient, Group, Step

client = OJSClient(url="http://localhost:8080")

workflow = Group([
    ${steps.join(',\n    ')},
])

job_id = await client.enqueue_workflow(workflow)
print(f"Workflow started: {job_id}")`;
    }

    return `from openjobspec import OJSClient, Batch, Step

client = OJSClient(url="http://localhost:8080")

workflow = Batch(
    tasks=[
        ${steps.join(',\n        ')},
    ],
    on_complete=Step("${def.callbackType || 'batch.callback'}"),
)

job_id = await client.enqueue_workflow(workflow)
print(f"Workflow started: {job_id}")`;
  },

  java: (def) => {
    const steps = def.steps.map((s) => {
      const args = s.args ? JSON.parse(s.args) : [];
      const argsStr = args.map((a: unknown) => `"${a}"`).join(', ');
      return `Step.of("${s.jobType}", ${argsStr || '""'})`;
    });

    if (def.type === 'chain') {
      return `import org.openjobspec.sdk.*;

public class Main {
    public static void main(String[] args) {
        var client = OJSClient.create("http://localhost:8080");

        var workflow = Workflow.chain(
            ${steps.join(',\n            ')}
        );

        var id = client.enqueueWorkflow(workflow);
        System.out.println("Workflow started: " + id);
    }
}`;
    }

    if (def.type === 'group') {
      return `import org.openjobspec.sdk.*;

public class Main {
    public static void main(String[] args) {
        var client = OJSClient.create("http://localhost:8080");

        var workflow = Workflow.group(
            ${steps.join(',\n            ')}
        );

        var id = client.enqueueWorkflow(workflow);
        System.out.println("Workflow started: " + id);
    }
}`;
    }

    return `import org.openjobspec.sdk.*;

public class Main {
    public static void main(String[] args) {
        var client = OJSClient.create("http://localhost:8080");

        var workflow = Workflow.batch(
            List.of(
                ${steps.join(',\n                ')}
            ),
            Step.of("${def.callbackType || 'batch.callback'}")
        );

        var id = client.enqueueWorkflow(workflow);
        System.out.println("Workflow started: " + id);
    }
}`;
  },

  rust: (def) => {
    const steps = def.steps.map((s) => {
      const args = s.args ? JSON.parse(s.args) : [];
      const argsStr = args.map((a: unknown) => `json!(${JSON.stringify(a)})`).join(', ');
      return `Step::new("${s.jobType}").args(vec![${argsStr}])`;
    });

    const methodName = def.type;

    if (def.type === 'batch') {
      return `use openjobspec::{OJSClient, Workflow, Step};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = OJSClient::new("http://localhost:8080");

    let workflow = Workflow::batch(
        vec![
            ${steps.join(',\n            ')},
        ],
        Step::new("${def.callbackType || 'batch.callback'}"),
    );

    let id = client.enqueue_workflow(workflow).await?;
    println!("Workflow started: {id}");
    Ok(())
}`;
    }

    return `use openjobspec::{OJSClient, Workflow, Step};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = OJSClient::new("http://localhost:8080");

    let workflow = Workflow::${methodName}(vec![
        ${steps.join(',\n        ')},
    ]);

    let id = client.enqueue_workflow(workflow).await?;
    println!("Workflow started: {id}");
    Ok(())
}`;
  },

  ruby: (def) => {
    const steps = def.steps.map((s) => {
      const args = s.args ? JSON.parse(s.args) : [];
      const argsStr = args.map((a: unknown) => JSON.stringify(a)).join(', ');
      return `OJS::Step.new("${s.jobType}", args: [${argsStr}])`;
    });

    if (def.type === 'chain') {
      return `require "openjobspec"

client = OJS::Client.new(url: "http://localhost:8080")

workflow = OJS::Workflow.chain([
  ${steps.join(',\n  ')},
])

id = client.enqueue_workflow(workflow)
puts "Workflow started: #{id}"`;
    }

    if (def.type === 'group') {
      return `require "openjobspec"

client = OJS::Client.new(url: "http://localhost:8080")

workflow = OJS::Workflow.group([
  ${steps.join(',\n  ')},
])

id = client.enqueue_workflow(workflow)
puts "Workflow started: #{id}"`;
    }

    return `require "openjobspec"

client = OJS::Client.new(url: "http://localhost:8080")

workflow = OJS::Workflow.batch(
  [
    ${steps.join(',\n    ')},
  ],
  on_complete: OJS::Step.new("${def.callbackType || 'batch.callback'}")
)

id = client.enqueue_workflow(workflow)
puts "Workflow started: #{id}"`;
  },

  dotnet: (def) => {
    const steps = def.steps.map((s) => {
      const args = s.args ? JSON.parse(s.args) : [];
      const argsStr = args.map((a: unknown) => `"${a}"`).join(', ');
      return `new Step("${s.jobType}", ${argsStr || '""'})`;
    });

    if (def.type === 'chain') {
      return `using OpenJobSpec;

var client = new OJSClient("http://localhost:8080");

var workflow = Workflow.Chain(
    ${steps.join(',\n    ')}
);

var id = await client.EnqueueWorkflowAsync(workflow);
Console.WriteLine($"Workflow started: {id}");`;
    }

    if (def.type === 'group') {
      return `using OpenJobSpec;

var client = new OJSClient("http://localhost:8080");

var workflow = Workflow.Group(
    ${steps.join(',\n    ')}
);

var id = await client.EnqueueWorkflowAsync(workflow);
Console.WriteLine($"Workflow started: {id}");`;
    }

    return `using OpenJobSpec;

var client = new OJSClient("http://localhost:8080");

var workflow = Workflow.Batch(
    new[] {
        ${steps.join(',\n        ')}
    },
    onComplete: new Step("${def.callbackType || 'batch.callback'}")
);

var id = await client.EnqueueWorkflowAsync(workflow);
Console.WriteLine($"Workflow started: {id}");`;
  },
};

/* ---------- language metadata ---------- */
const LANGUAGES: { id: Language; label: string; icon: string; ext: string }[] = [
  { id: 'go', label: 'Go', icon: '🔵', ext: '.go' },
  { id: 'typescript', label: 'TypeScript', icon: '🟦', ext: '.ts' },
  { id: 'python', label: 'Python', icon: '🐍', ext: '.py' },
  { id: 'java', label: 'Java', icon: '☕', ext: '.java' },
  { id: 'rust', label: 'Rust', icon: '🦀', ext: '.rs' },
  { id: 'ruby', label: 'Ruby', icon: '💎', ext: '.rb' },
  { id: 'dotnet', label: '.NET', icon: '🟣', ext: '.cs' },
];

/* ---------- component ---------- */
export function WorkflowCodeGen({
  steps,
  workflowType,
  callbackType,
}: {
  steps: { jobType: string; args: string; queue?: string }[];
  workflowType: WorkflowType;
  callbackType?: string;
}) {
  const [selectedLang, setSelectedLang] = useState<Language>('typescript');
  const [copied, setCopied] = useState(false);

  const def: WorkflowDef = { type: workflowType, steps, callbackType };
  const errors = useMemo(() => validateWorkflow(def), [steps, workflowType, callbackType]);
  const code = useMemo(() => {
    if (steps.length === 0) return '// Add steps to generate code';
    try {
      return generators[selectedLang](def);
    } catch {
      return '// Error generating code — check step configuration';
    }
  }, [steps, workflowType, callbackType, selectedLang]);

  const lang = LANGUAGES.find((l) => l.id === selectedLang)!;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Validation Issues</div>
          {errors.map((e, i) => (
            <div key={i} className="text-xs text-red-500 dark:text-red-400">• {e.message}</div>
          ))}
        </div>
      )}

      {/* Language tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedLang(l.id)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition ${
              selectedLang === l.id
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span>{l.icon}</span> {l.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={copyCode}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1"
        >
          {copied ? '✓ Copied' : `Copy ${lang.ext}`}
        </button>
      </div>

      {/* Code preview */}
      <pre className="p-4 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-96 leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
