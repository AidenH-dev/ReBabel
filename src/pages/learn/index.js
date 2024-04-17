import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeftLong, FaArrowRight, FaArrowRightLong } from "react-icons/fa6";
import { CiPlay1 } from "react-icons/ci";
import { useState } from "react"; // Import useState for state management



export default function Learn() {
    const [responseMessage, setResponseMessage] = useState(null); // Initialize state for response

    const handleButtonClick = async () => {
        try {
            const response = await fetch('/api/gpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Include a body if your API expects any data, otherwise it can be omitted
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data);
            setResponseMessage(data.messages); // Update response state with received answer
            // Update UI or display the answer using data.answer (assuming the API response has an 'answer' property)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


  return (
    <main className="flex flex-col items-center justify-between h-screen overflow-hidden px-10 py-4 relative">
      {/* Floating back button at the top left */}
      <div className="absolute top-0 left-0 m-4">
        <Link href="/" className="text-left text-4xl font-semibold leading-tight">
            <FaArrowLeftLong />
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center w-full">
        <Head>
          <title>Learn</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="flex flex-col items-center justify-center mt-24">
          <p className="text-center text-2xl leading-loose mb-8">
            Get started by clicking on <code className="font-bold">Learn</code>
          </p>

          <div className="flex items-center justify-center flex-wrap max-w-screen-md mt-2 mx-auto">
            <div className="m-4 flex-grow flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 ">
              <div className="flex items-center">
                <h3 className="font-semibold text-2xl flex items-center">
                    Generate A Sentance <span className="ml-2"></span>
                </h3>                
                <button 
                    className="p-2 bg-blue-600 text-white rounded flex items-center justify-center"
                    onClick={handleButtonClick} // Directly using the handler here
                >
                    <CiPlay1 />
                </button>
              </div>     
              <div className="flex items-center my-10">
              {responseMessage && ( // Conditionally render response message
                  <p className="font-semibold mx-2 text-green-500">{responseMessage}</p>
                )} 
            </div>
              <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                Check <span className="ml-2"></span>
              </h3>
              <div className="flex items-center">
                <input type="text" className="flex-grow p-2 border border-gray-300 mr-2 rounded" placeholder="Type your message..." />
                <button 
                    className="p-2 bg-blue-600 text-white rounded flex items-center justify-center"
                    // Directly using the handler here
                >
                    Send <FaArrowRight className="ml-2" />
                </button>
              </div>           
            </div>
          </div>
        </main>
      </div>
    </main>

  );
}
