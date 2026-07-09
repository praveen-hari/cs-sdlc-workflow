import { useState, useEffect, useCallback } from 'preact/hooks';
import { Sidebar } from './components/Sidebar';
import { Overview } from './screens/Overview';
import { Plugins } from './screens/Plugins';
import { ProjectContext } from './screens/ProjectContext';
import { Work } from './screens/Work';
import { History } from './screens/History';
import { Settings } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { postMessage } from './vscode';
import type { DataUpdateMessage, IncomingMessage } from './types';
import './styles/global.css';

export function App() {
  const [screen, setScreen] = useState('overview');
  const [data, setData] = useState<DataUpdateMessage | null>(null);

  const handleSwitchScreen = useCallback((name: string) => {
    setScreen(name);
    postMessage({ type: 'switchScreen', screen: name });
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent<IncomingMessage>) => {
      const msg = event.data;
      if (msg.type === 'dataUpdate') {
        setData(msg);
        if (!msg.isLoaded) {
          setScreen('onboarding');
        } else if (msg.activeScreen && msg.activeScreen !== 'onboarding') {
          setScreen(msg.activeScreen);
        }
      } else if (msg.type === 'switchScreen') {
        setScreen(msg.screen);
      }
    };

    window.addEventListener('message', handler);
    postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handler);
  }, []);

  // Show onboarding if not loaded
  if (screen === 'onboarding' || (data && !data.isLoaded)) {
    return <Onboarding />;
  }

  const status = data?.status ?? null;
  const workIndex = data?.workIndex ?? null;
  const decisionsIndex = data?.decisionsIndex ?? null;
  const releasesIndex = data?.releasesIndex ?? null;
  const snapshot = data?.snapshot ?? null;
  const contextDocs = data?.contextDocs ?? {};
  const activeWorkDetails = data?.activeWorkDetails ?? {};

  return (
    <div class="shell">
      <Sidebar activeScreen={screen} onNavigate={handleSwitchScreen} workIndex={workIndex} />
      <main class="detail">
        {screen === 'overview' && (
          <Overview status={status} workIndex={workIndex} snapshot={snapshot} contextDocs={contextDocs} onNavigate={handleSwitchScreen} />
        )}
        {screen === 'plugins' && <Plugins />}
        {screen === 'context' && <ProjectContext status={status} contextDocs={contextDocs} />}
        {screen === 'work' && <Work status={status} workIndex={workIndex} activeWorkDetails={activeWorkDetails} />}
        {screen === 'history' && (
          <History workIndex={workIndex} decisionsIndex={decisionsIndex} releasesIndex={releasesIndex} />
        )}
        {screen === 'settings' && <Settings />}
      </main>
    </div>
  );
}
