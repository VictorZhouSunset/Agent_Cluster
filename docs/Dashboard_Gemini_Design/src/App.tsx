import { useState } from 'react';
import AppShell from './components/AppShell';
import OverviewScreen from './screens/OverviewScreen';
import SessionsScreen from './screens/SessionsScreen';
import SkillsScreen from './screens/SkillsScreen';
import FilesScreen from './screens/FilesScreen';

export type Section = 'overview' | 'sessions' | 'skills' | 'files';

export default function App() {
  const [currentSection, setCurrentSection] = useState<Section>('overview');

  return (
    <AppShell currentSection={currentSection} onSectionChange={setCurrentSection}>
      {currentSection === 'overview' && <OverviewScreen />}
      {currentSection === 'sessions' && <SessionsScreen />}
      {currentSection === 'skills' && <SkillsScreen />}
      {currentSection === 'files' && <FilesScreen />}
    </AppShell>
  );
}
