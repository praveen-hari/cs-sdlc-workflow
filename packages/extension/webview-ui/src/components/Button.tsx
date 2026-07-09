import type { ComponentChildren } from 'preact';
import { openInChat, executeCommand } from '../vscode';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  icon?: string;
  prompt?: string;
  command?: string;
  onClick?: () => void;
  disabled?: boolean;
  class?: string;
  style?: string;
  children: ComponentChildren;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  prompt,
  command,
  onClick,
  disabled,
  class: className = '',
  style,
  children,
}: ButtonProps) {
  const handleClick = () => {
    if (prompt) {
      openInChat(prompt);
    } else if (command) {
      executeCommand(command);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      class={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon && <span class={`codicon ${icon}`} />}
      {children}
    </button>
  );
}
