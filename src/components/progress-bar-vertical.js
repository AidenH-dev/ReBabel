import { useState, useEffect } from "react";

export default function VerticalProgressBar() {
  const [progress, setProgress] = useState(0); // Main progress bar
  const [notches, setNotches] = useState(0); // Notches on the second bar

  useEffect(() => {
    if (progress > 100) {
      setProgress(0); // Reset progress
      setNotches((prevNotches) => prevNotches + 1); // Increment notch bar
    }
  }, [progress]);

  return (
    <div className="my-6 flex items-start gap-4">
      {/* Vertical Progress Bar */}
      <div
        className="relative w-6 h-64 bg-gray-700 rounded-md overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className="absolute bottom-0 left-0 w-full bg-[#da1c60] text-center text-white text-xs"
          style={{ height: `${progress}%`, transition: "height 2s" }}
        >
          {progress === 0 ? "" : `${progress}%`}
        </div>
      </div>

      {/* Notch Bar */}
      <div className="relative w-6 h-64 bg-gray-300 rounded-md overflow-hidden">
        {Array.from({ length: notches }).map((_, index) => (
          <div
            key={index}
            className="w-full h-3 border-2 border-[#fdc700] bg-[#fdf300] mt-1 rounded"
            style={{ transition: "transform 0.2s" }}
          ></div>
        ))}
      </div>

      {/* Buttons to Control Progress */}
      <div className="flex flex-col gap-2">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => setProgress((prev) => prev + 10)}
        >
          Increase
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => setProgress((prev) => Math.max(0, prev - 10))}
        >
          Decrease
        </button>
      </div>
    </div>
  );
}
//{/* Light Version */}
//<div className="bg-gray-200 rounded h-1" role="progressbar" aria-valuenow={width} aria-valuemin="0" aria-valuemax="100">
//  <div
//    className="bg-green-400 rounded h-1 text-center"
//    style={{ width: `${width}%`, transition: "width 2s" }}
//  ></div>
//</div>
//{/* Regular Version */}
//<div className="bg-gray-200 rounded h-4 mt-5" role="progressbar" aria-valuenow={width} aria-valuemin="0" aria-valuemax="100">
//  <div
//    className="bg-green-400 rounded h-4 text-center"
//    style={{ width: `${width}%`, transition: "width 2s" }}
//  ></div>
//</div>
//{
//  /* Light Version */
//}
//<div
//  className="bg-gray-900 rounded h-1"
//  role="progressbar"
//  aria-valuenow={width}
//  aria-valuemin="0"
//  aria-valuemax="100"
//>
//  <div
//    className="bg-blue-800 rounded h-1 text-center"
//    style={{ width: `${width}%`, transition: "width 2s" }}
//  ></div>
//</div>;
//
//{
//  /* Regular Version */
//}
//<div
//  className="bg-gray-900 rounded h-4 mt-5"
//  role="progressbar"
//  aria-valuenow={width}
//  aria-valuemin="0"
//  aria-valuemax="100"
//>
//  <div
//    className="bg-blue-800 rounded h-4 text-center"
//    style={{ width: `${width}%`, transition: "width 2s" }}
//  ></div>
//</div>;

//{/* Light Mode */}
//<div className="p-10 max-w-full bg-white shadow rounded">
//  {/* Regular with Text Version */}
//  <div
//    className="bg-gray-200 rounded h-6"
//    role="progressbar"
//    aria-valuenow={width}
//    aria-valuemin="0"
//    aria-valuemax="100"
//  >
//    <div
//      className="bg-[#f13476] rounded h-6 text-center text-white text-sm"
//      style={{ width: `${width}%`, transition: "width 2s" }}
//    >
//      {`${width}%`}
//    </div>
//  </div>
//</div>
