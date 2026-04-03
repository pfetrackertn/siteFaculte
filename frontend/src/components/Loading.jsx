import { AiOutlineLoading } from "react-icons/ai";

const Loading = ({ label = "Chargement en cours..." }) => {
  return (
    <div className="flex h-[38vh] w-full flex-col items-center justify-center gap-4 rounded-[28px] border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <AiOutlineLoading className="animate-spin text-4xl" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
};

export default Loading;
