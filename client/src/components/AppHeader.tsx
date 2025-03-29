export default function AppHeader() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="material-icons text-[#4285F4] text-3xl">menu_book</span>
          <h1 className="font-['Google_Sans'] text-xl md:text-2xl font-bold text-gray-800">ReadSmart</h1>
        </div>
        <nav>
          <button className="font-['Google_Sans'] text-[#4285F4] hover:bg-[#4285F4]/10 px-4 py-2 rounded transition">Help</button>
        </nav>
      </div>
    </header>
  );
}
