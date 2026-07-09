import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import BoardList from './components/BoardList';
import MoodItemList from './components/MoodItemList';
import SurpriseMeButton from './components/SurpriseMeButton';
import KinesisTriggerLogs from './components/KinesisTriggerLogs';
import './App.css';

function App() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app-container">
          <header className="header">
            <h1>🎨 Mood Board</h1>
            <div className="header-user">
              <span>{user?.signInDetails?.loginId}</span>
              <button className="btn btn-secondary" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </header>
          <SurpriseMeButton />
          <KinesisTriggerLogs />
          <BoardList selectedBoardId={selectedBoardId} onSelectBoard={setSelectedBoardId} />
          <MoodItemList selectedBoardId={selectedBoardId} />
        </div>
      )}
    </Authenticator>
  );
}

export default App;
