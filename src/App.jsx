import { useCarbon } from './hooks/useCarbon';
import Quiz from './components/Quiz/Quiz';
import Dashboard from './components/Dashboard/Dashboard';

export default function App() {
  const carbon = useCarbon();

  if (carbon.step === 'quiz') {
    return <Quiz onSubmit={carbon.submitQuiz} />;
  }

  return (
    <Dashboard
      footprint={carbon.footprint}
      geminiData={carbon.geminiData}
      loading={carbon.loading}
      error={carbon.error}
      completed={carbon.completed}
      onToggle={carbon.toggleAction}
      onRefresh={carbon.refreshActions}
      onReset={carbon.reset}
    />
  );
}
