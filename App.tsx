
import React, { useState, useCallback, ChangeEvent } from 'react';
import { generatePetCollage } from './services/geminiService';
import { Spinner } from './components/Spinner';
import { UploadIcon, PhotoIcon, SparklesIcon, ArrowPathIcon } from './components/icons';

const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(';')[0].split(':')[1];
      const base64Data = result.split(',')[1];
      resolve({ data: base64Data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6">
    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
      Pet Expression Collage
    </h1>
    <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
      Turn your pet's photo into a fun 3x3 expression grid with a single click!
    </p>
  </header>
);

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, previewUrl }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-center items-center w-full h-64 border-2 border-dashed border-gray-300 hover:border-blue-400">
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <div className="text-center p-4">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">Upload your pet's photo</span>
            <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</span>
          </div>
        )}
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
      </label>
    </div>
  );
};

interface ResultDisplayProps {
  imageUrl: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageUrl }) => (
  <div className="w-full max-w-lg mx-auto mt-8">
    <div className="bg-white rounded-xl shadow-lg overflow-hidden p-2">
      <img src={imageUrl} alt="Generated collage" className="w-full h-auto object-contain rounded-lg" />
    </div>
    <div className="text-center mt-4">
      <a href={imageUrl} download="pet-collage.png" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
        Download Image
      </a>
    </div>
  </div>
);

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setGeneratedImageUrl(null);
    setError(null);
  }, []);

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Please select a photo first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const { data, mimeType } = await fileToBase64(selectedFile);
      const imageUrl = await generatePetCollage(data, mimeType);
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
      } else {
        setError('The AI could not generate an image from the provided photo. Please try another one.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      setGeneratedImageUrl(null);
      setError(null);
      setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
      <div className="relative isolate px-6 pt-6 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80d4ff] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
        </div>
        
        <div className="mx-auto max-w-4xl py-12 sm:py-20">
          <Header />
          <main className="mt-10">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative max-w-md mx-auto mb-6" role="alert">
                <strong className="font-bold">Oops! </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {!generatedImageUrl && (
                <div className="text-center">
                    <FileUploader onFileSelect={handleFileSelect} previewUrl={previewUrl} />
                </div>
            )}
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center mt-8">
                <Spinner />
                <p className="mt-4 text-gray-600 animate-pulse">AI is creating your collage...</p>
              </div>
            )}

            {generatedImageUrl && !isLoading && (
              <ResultDisplay imageUrl={generatedImageUrl} />
            )}

            <div className="mt-8 text-center">
              {!isLoading && !generatedImageUrl && (
                <button
                  onClick={handleGenerate}
                  disabled={!selectedFile || isLoading}
                  className="inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <SparklesIcon className="w-6 h-6 mr-2"/>
                  Generate Collage
                </button>
              )}
              
              {generatedImageUrl && !isLoading && (
                 <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300"
                >
                  <ArrowPathIcon className="w-6 h-6 mr-2"/>
                  Create Another
                </button>
              )}
            </div>
          </main>
        </div>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
        </div>
      </div>
    </div>
  );
}
