import { useEffect, useState } from "react";

export default function ProgressBarComponent({ progress }) {
  return (
    <div className="my-6 w-full">
      <div>
        <div
          className="bg-gray-700 rounded h-6"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className="bg-[#da1c60] rounded h-6 text-center text-white text-sm"
            style={{ width: `${progress}%`, transition: "width 2s" }}
          >
            {`${progress}%`}
          </div>
        </div>
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
