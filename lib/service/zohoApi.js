const { zohoData, zohoDataSTudent } = require("../helpers/zohotoken");

class ZohoCalculation {
  async getStudents(min_value, max_value) {
    try {
      const initialParams = {
        criteria: "Student_ID1 != null",
      };
      const getStudentsReport = "All_Students";
      const stdData = await zohoData(getStudentsReport, initialParams);

      if (stdData.data && stdData.data.length > 0) {
        // Sort the data by Student_ID1 in ascending order
        stdData.data.sort((a, b) => a.Student_ID1 - b.Student_ID1);

        // Get the last student ID
        const lastStudentID = stdData.data[stdData.data.length - 1].Student_ID1;

        // Fetch students within the specified range
        const rangeParams = {
          criteria:
            "Student_ID1 >=" + min_value + "&& Student_ID1 <=" + max_value,
          max_records: 1000,
        };
        const getStudents = "All_Students";
        const studentsData = await zohoData(getStudents, rangeParams);
        return { Count: lastStudentID, Data: studentsData.data };
      } else {
        return null; // No students found
      }
    } catch (error) {
      return { error: "An error occurred while fetching student data." };
    }
  }
  async getFilteredStudents(filters, isDev) {
    try {
      const { campus, school, status, idStart, idEnd } = filters;
      const startTime = Date.now();
      
      // Build filter criteria
      const criteria = [];

    if (campus) criteria.push(`Select_Campus.Campus_Name == "${campus.trim()}"`);
    if (school) criteria.push(`Select_School1 == "${school.trim()}"`);
    if (status) criteria.push(`Status == "${status.trim()}"`);
    if (idStart) criteria.push(`Student_ID1 >= ${idStart}`);
    if (idEnd) criteria.push(`Student_ID1 <= ${idEnd}`);

    const params = {
      max_records: 1000,
      ...(criteria.length > 0 && { criteria: criteria.join(" && ") })
    };

      // Fetch students using criteria with max_records
      const response = await zohoDataSTudent("Ghar_Student_Report", params, isDev);
      
      const queryTime = Date.now() - startTime;

      if (!response?.data || response.data.length === 0) {
        console.log(`No students found in ${queryTime}ms`);
        return {
          filters: {
            campus: campus || "all",
            school: school || "all",
            status: status || "all",
            studentIdRange: idStart || idEnd ? `${idStart || 'min'} - ${idEnd || 'max'}` : "all"
          },
          students: [],
          totalStudents: 0,
          appliedCriteria: params.criteria || "all students",
          queryTime: `${queryTime}ms`
        };
      }

      // Sort by Student_ID1 like zohoApi.js does
      if (response.data[0]?.Student_ID1 !== undefined) {
        response.data.sort((a, b) => a.Student_ID1 - b.Student_ID1);
      }

      console.log(`Found ${response.data.length} students in ${queryTime}ms`);

      // Get actual ID range from results
      const studentIds = response.data
        .map(s => s.Student_ID1)
        .filter(id => id !== null && id !== undefined);
      
      const minId = studentIds.length > 0 ? Math.min(...studentIds) : null;
      const maxId = studentIds.length > 0 ? Math.max(...studentIds) : null;

      return {
        filters: {
          campus: campus || "all",
          school: school || "all",
          status: status || "all",
          requestedIdRange: idStart || idEnd ? `${idStart || 'min'} - ${idEnd || 'max'}` : "all",
          actualIdRange: minId && maxId ? `${minId} - ${maxId}` : "N/A"
        },
        students: response.data,
        totalStudents: response.data.length,
        appliedCriteria: params.criteria || "all students",
        queryTime: `${queryTime}ms`
      };
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  }
}

module.exports = new ZohoCalculation();
