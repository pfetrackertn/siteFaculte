import { useCallback, useEffect, useState } from "react";
import axiosWrapper from "../utils/AxiosWrapper";

const EMPTY_ARRAY = [];

const safeFetchList = async (url, token) => {
  try {
    const response = await axiosWrapper.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.success ? response.data.data : EMPTY_ARRAY;
  } catch (error) {
    if (error.response?.status === 404) {
      return EMPTY_ARRAY;
    }

    throw error;
  }
};

const useAcademicOptions = () => {
  const token = localStorage.getItem("userToken");
  const [academicYears, setAcademicYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshOptions = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const [
        fetchedAcademicYears,
        fetchedDepartments,
        fetchedBranches,
        fetchedClasses,
        fetchedPromotions,
      ] = await Promise.all([
        safeFetchList("/academic-year", token),
        safeFetchList("/department", token),
        safeFetchList("/branch", token),
        safeFetchList("/class", token),
        safeFetchList("/promotion", token),
      ]);

      setAcademicYears(fetchedAcademicYears);
      setDepartments(fetchedDepartments);
      setBranches(fetchedBranches);
      setClasses(fetchedClasses);
      setPromotions(fetchedPromotions);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshOptions();
  }, [refreshOptions]);

  return {
    academicYears,
    departments,
    branches,
    classes,
    promotions,
    loading,
    refreshOptions,
  };
};

export default useAcademicOptions;
