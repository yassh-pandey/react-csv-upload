import { UploadProvider, Uploader, DisplayGrid } from '../lib/components';
import './App.css';

function App() {
    return (
        <>
            <UploadProvider
                access_key={import.meta.env.VITE_access_key ?? ''}
                file_exists_endpoint="http://localhost:3000/file-exists"
                upload_endpoint="http://localhost:3000/uploads"
            >
                <div className="app">
                    <Uploader />
                    <DisplayGrid width={700} height={450} rowHeight={100} columnHeight={200} />
                </div>
            </UploadProvider>
        </>
    );
}

export default App;
