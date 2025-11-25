function App() {
  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center p-10">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">SmartSort AI</h1>
      
      <div className="w-full max-w-lg h-64 border-4 border-dashed border-gray-600 rounded-xl flex items-center justify-center hover:border-blue-500 hover:bg-gray-800 transition-all cursor-pointer">
        <div className="text-center">
          <p className="text-xl text-gray-300">Przeciągnij pliki tutaj</p>
          <p className="text-sm text-gray-500 mt-2">lub kliknij, aby wybrać</p>
        </div>
      </div>

      <button className="mt-8 px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors">
        Rozpocznij Sortowanie
      </button>
    </div>
  );
}

export default App;