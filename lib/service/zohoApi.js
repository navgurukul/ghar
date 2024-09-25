const { zohoData } = require("../helpers/zohotoken");
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
}

module.exports = new ZohoCalculation();
