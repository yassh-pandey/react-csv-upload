import { UploadProvider, Uploader, DisplayGrid } from './components';
// import './App.css';

function App() {
    return (
        <>
            <UploadProvider access_key="3fc322313b2a54286b8c6192ca4b7487">
                <div className="app">
                    <Uploader />
                    <DisplayGrid width={700} height={450} rowHeight={100} columnHeight={200} />
                </div>
            </UploadProvider>
        </>
    );
}

export default App;
