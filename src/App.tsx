import { UploadProvider, Uploader, DisplayGrid } from './components';
// import './App.css';

function App() {
    return (
        <>
            <UploadProvider access_key={process?.env?.access_key ?? ''}>
                <div className="app">
                    <Uploader />
                    <DisplayGrid width={700} height={450} rowHeight={100} columnHeight={200} />
                </div>
            </UploadProvider>
        </>
    );
}

export default App;
