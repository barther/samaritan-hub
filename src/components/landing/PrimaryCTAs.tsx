import { Link } from "react-router-dom";
import { HeartHandshake, MessageSquare } from "lucide-react";

const PrimaryCTAs = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
      <Link
        to="/give"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors min-w-[200px] justify-center"
      >
        <HeartHandshake className="h-5 w-5" />
        Give
      </Link>
      
      <Link
        to="/request"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors min-w-[200px] justify-center"
      >
        <MessageSquare className="h-5 w-5" />
        Request Assistance
      </Link>
    </div>
  );
};

export default PrimaryCTAs;