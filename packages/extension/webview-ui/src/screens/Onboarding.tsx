import { openInChat } from '../vscode';

export function Onboarding() {
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

          {/* Option 2: New Project */}
          <button
            class="onboarding-option"
            onClick={() => openInChat(
              'I want to start a new project from scratch. ' +
              'Interview me to gather the details before creating anything. ' +
              'Ask ONE question at a time and wait for my answer before asking the next. ' +
              'Attach your best guess to each question so I can confirm or correct. ' +
              'I need you to find out: 1) What I\'m building and why, 2) Who the target users are, ' +
              '3) What tech stack to use, 4) What the first feature should be. ' +
              'After gathering all answers, show me a structured summary and wait for my explicit "yes" before creating the .sdlc/ directory. ' +
              'Do NOT create anything until I confirm.'
            )}
          >
            <div class="onboarding-option-icon is-accent">
              <span class="codicon codicon-wand" />
            </div>
            <div class="onboarding-option-content">
              <div class="onboarding-option-title">Start New Project</div>
              <div class="onboarding-option-desc">
                Describe what you want to build and I'll help you choose the right tech stack,
                set up the project structure, and configure everything.
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
