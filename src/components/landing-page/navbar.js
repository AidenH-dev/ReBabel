import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 px-6 py-4 bg-white border-b-2 border-gray-200">
      <div className="flex items-center justify-between xl:mx-80">
        {/* Navbar Brand */}
        <div className="flex items-center space-x-2">
          <Image
            src="/ReBabel.png"
            alt="ReBabel Logo"
            width={600}
            height={400}
            className="max-w-[150px] h-auto" // Adjust max width and height as needed
          />
        </div>
        {/* Navbar Content - Center
        <div className="hidden sm:flex space-x-6">
          <Link href="#" className="text-gray-600 hover:text-gray-900">
            Features
          </Link>
          <Link
            href="#"
            className="text-gray-800 font-semibold"
            aria-current="page"
          >
            Customers
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900">
            Integrations
          </Link>
        </div> */}
        {/* Navbar Content - End */}

        <div className="flex items-center space-x-4">
          <Link
            href="#"
            className="hidden lg:inline text-gray-600 hover:text-gray-900"
          >
            Login
          </Link>
          <Link href="#">
            <div className=" relative inline-block">
              <div className="absolute inset-x-0 bottom-0 bg-[#B0104F] rounded-lg translate-y-1 h-[90%] transition-transform duration-200"></div>
              <button className="relative px-4 py-1 text-white bg-[#E30B5C] active:bg-[#f41567] rounded-lg transform transition-transform duration-200 active:translate-y-1">
                Sign Up
              </button>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
