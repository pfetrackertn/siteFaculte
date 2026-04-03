import React, { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import Heading from "../../components/Heading";
import { useSelector } from "react-redux";
import axiosWrapper from "../../utils/AxiosWrapper";
import { toast } from "react-hot-toast";
import Loading from "../../components/Loading";
import {
  getAcademicClassLabel,
  formatSemesterLabel,
} from "../../utils/displayText";
const Timetable = () => {
  const [timetable, setTimetable] = useState("");
  const [timetableDetails, setTimetableDetails] = useState(null);
  const userData = useSelector((state) => state.userData);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const getTimetable = async () => {
      if (!userData?.semester || !userData?.branchId?._id) {
        setTimetable("");
        setTimetableDetails(null);
        return;
      }

      try {
        setDataLoading(true);
        const queryParams = new URLSearchParams({
          semester: userData.semester,
          branch: userData.branchId?._id,
        });

        if (userData.classId?._id) {
          queryParams.append("classId", userData.classId._id);
        }

        const response = await axiosWrapper.get(`/timetable?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });
        if (response.data.success && response.data.data.length > 0) {
          setTimetable(response.data.data[0].link);
          setTimetableDetails(response.data.data[0]);
        } else {
          setTimetable("");
          setTimetableDetails(null);
        }
      } catch (error) {
        if (error && error.response && error.response.status === 404) {
          setTimetable("");
          setTimetableDetails(null);
          return;
        }
        toast.error(
          error.response?.data?.message ||
            "Erreur lors du chargement de l'emploi du temps"
        );
        console.error(error);
      } finally {
        setDataLoading(false);
      }
    };
    getTimetable();
  }, [userData, userData.branchId, userData.semester]);

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10">
      <div className="flex justify-between items-center w-full">
        <Heading
          title={`Emploi du temps de ${formatSemesterLabel(userData.semester)}`}
          subtitle={`Classe : ${getAcademicClassLabel(userData.classId)}`}
        />
        {!dataLoading && timetable && (
          <p
            className="flex justify-center items-center text-lg font-medium cursor-pointer hover:text-red-500 hover:scale-110 ease-linear transition-all duration-200 hover:duration-200 hover:ease-linear hover:transition-all"
            onClick={() =>
              window.open(process.env.REACT_APP_MEDIA_LINK + "/" + timetable)
            }
          >
            Telecharger
            <span className="ml-2">
              <FiDownload />
            </span>
          </p>
        )}
      </div>
      {dataLoading && <Loading />}
      {!dataLoading && timetable && (
        <div className="mt-8 w-full">
          {timetableDetails?.classId ? (
            <p className="mb-4 text-sm font-medium text-slate-500">
              Document specifique a la classe{" "}
              <span className="font-semibold text-slate-800">
                {getAcademicClassLabel(timetableDetails.classId)}
              </span>
              .
            </p>
          ) : null}
          <img
            className="rounded-lg shadow-md w-[70%] mx-auto"
            src={process.env.REACT_APP_MEDIA_LINK + "/" + timetable}
            alt="emploi du temps"
          />
        </div>
      )}
      {!dataLoading && !timetable && (
        <p className="mt-10">Aucun emploi du temps n'est disponible pour le moment.</p>
      )}
    </div>
  );
};

export default Timetable;
