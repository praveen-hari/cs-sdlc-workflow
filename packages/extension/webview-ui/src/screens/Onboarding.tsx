import { useState } from 'preact/hooks';
import { openInChat } from '../vscode';

type OnboardingView = 'choose' | 'new-project';

export function Onboarding() {
  const [view, setView] = useState<OnboardingView>('choose');
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // ── New Project Form ─────────────────────────────────
  if (view === 'new-project') {
    const handleStart = () => {
      if (!projectName.trim()) return;
      const desc = projectDesc.trim();
      openInChat(
        `I want to start a new project called "${projectName.trim()}"` +
        (desc ? `. ${desc}` : '') + '.\n\n' +
        'Use the interview-me skill and the askQuestions tool to gather the remaining details. ' +
        'You already know the project name' + (desc ? ' and description' : '') + '. ' +
        'Now ask ONE question at a time using the askQuestions tool with predefined options where possible. ' +
        'Cover: who the target users are, what tech stack to use, and what the first feature should be. ' +
        'After the interview, show a summary and wait for my explicit "yes" before initializing the .sdlc/ directory. ' +
        'Do NOT create anything until I confirm.'
      );
    };

    return (
      <div class="onboarding-shell">
        <div class="onboarding-container">
          <div class="onboarding-icon">
            <span class="codicon codicon-wand" />
          </div>
          <h1 class="onboarding-title">Start New Project</h1>
          <p class="onboarding-subtitle">
            Give your project a name and optionally describe what you're building.<br />
            The agent will interview you for the remaining details.
          </p>

          <div class="flex flex-col gap-lg" style="width:100%; max-width:440px;">
            {/* Project Name */}
            <div class="form-group">
              <label class="form-label">Project Name *</label>
              <input
                type="text"
                class="form-textarea"
                style="height:32px; resize:none; padding:6px 10px;"
                placeholder="e.g., my-saas-app, task-tracker, portfolio-site"
                value={projectName}
                onInput={(e) => setProjectName((e.target as HTMLInputElement).value)}
                autoFocus
              />
            </div>

            {/* Description */}
            <div class="form-group">
              <label class="form-label">What are you building? <span class="text-secondary">(optional)</span></label>
              <textarea
                class="form-textarea"
                rows={3}
                placeholder="e.g., A task management app for small teams with real-time collaboration and Kanban boards"
                value={projectDesc}
                onInput={(e) => setProjectDesc((e.target as HTMLTextAreaElement).value)}
              />
              <div class="form-hint">The more detail you provide, the fewer questions the agent will need to ask.</div>
            </div>

            {/* Actions */}
            <div class="flex gap-sm">
              <button
                class="btn btn-primary"
                style="height:32px; padding:0 20px;"
                onClick={handleStart}
                disabled={!projectName.trim()}
              >
                <span class="codicon codicon-rocket" /> Start in Chat
              </button>
              <button
                class="btn btn-secondary"
                style="height:32px;"
                onClick={() => { setProjectName(''); setProjectDesc(''); setView('choose'); }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Choose View (default) ────────────────────────────
  return (
    <div class="onboarding-shell">
      <div class="onboarding-container">

        {/* Icon */}
        <div class="onboarding-icon">
          <span class="codicon codicon-rocket" />
        </div>

        {/* Title */}
        <h1 class="onboarding-title">Welcome to SDLC Workflow</h1>
        <p class="onboarding-subtitle">
          Set up AI-assisted development for your project.<br />
          The agent will understand your codebase, follow your conventions,<br />
          and track work from idea to completion.
        </p>

        {/* Two Options */}
        <div class="onboarding-options">

          {/* Option 1: Existing Project */}
          <button
            class="onboarding-option"
            onClick={() => openInChat(
              'Scan this workspace and initialize SDLC tracking. ' +
              'Read package.json, tsconfig, folder structure, test config, and README to auto-detect the project details. ' +
              'Then show me a summary of what you found — project name, tech stack, modules, testing framework, build commands — ' +
              'and wait for my explicit confirmation before creating the .sdlc/ directory. ' +
              'Do NOT create anything until I say "yes".'
            )}
          >
            <div class="onboarding-option-icon is-success">
              <span class="codicon codicon-root-folder" />
            </div>
            <div class="onboarding-option-content">
              <div class="onboarding-option-title">Set Up Existing Project</div>
              <div class="onboarding-option-desc">
                Scan your workspace to detect the tech stack, folder structure, and conventions
                automatically. Best for projects that already have code.
              </div>
            </div>
            <div class="onboarding-option-arrow">
              <span class="codicon codicon-arrow-right" />
            </div>
          </button>

          {/* Option 2: New Project → shows form */}
          <button
            class="onboarding-option"
            onClick={() => setView('new-project')}
          >
            <div class="onboarding-option-icon is-accent">
              <span class="codicon codicon-wand" />
            </div>
            <div class="onboarding-option-content">
              <div class="onboarding-option-title">Start New Project</div>
              <div class="onboarding-option-desc">
                Name your project, describe what you want to build, and the agent will
                interview you for the details before setting everything up.
              </div>
            </div>
            <div class="onboarding-option-arrow">
              <span class="codicon codicon-arrow-right" />
            </div>
          </button>

        </div>

        {/* Footer */}
        <div class="onboarding-footer">
          You can also type{' '}
          <code>/init-sdlc</code>{' '}
          in chat anytime to start this process.
        </div>

      </div>
    </div>
  );
}
