import { Button } from '../components/Button';

export function Onboarding() {
  return (
    <div class="onboarding-shell">
      <div class="onboarding-container">
        <span
          class="codicon codicon-rocket"
          style="font-size:48px; color:var(--vscode-progressBar-background); margin-bottom:20px;"
        />
        <div class="view-title">Welcome to SDLC Workflow</div>
        <div class="text-secondary mt-sm" style="max-width:360px; line-height:1.5;">
          Set up AI-assisted development for your project. The agent will understand your codebase,
          follow your conventions, and track work from idea to completion.
        </div>
        <div class="flex flex-col gap-md mt-lg" style="width:300px;">
          <Button
            variant="primary"
            class="w-full"
            style="justify-content:center; height:32px;"
            icon="codicon-search"
            prompt="Scan this workspace and initialize SDLC tracking. Detect the tech stack, modules, and conventions automatically, then create the .sdlc/ directory."
          >
            Set Up Existing Project
          </Button>
          <Button
            class="w-full"
            style="justify-content:center; height:32px;"
            icon="codicon-sparkle"
            prompt="Initialize a new SDLC project for this workspace. Ask me for the project name and what I want to build."
          >
            Start New Project
          </Button>
        </div>
        <div class="text-secondary text-xs mt-lg">
          You can also type{' '}
          <code style="background:var(--vscode-textCodeBlock-background); padding:1px 4px; border-radius:3px;">
            /project-setup
          </code>{' '}
          in chat
        </div>
      </div>
    </div>
  );
}
