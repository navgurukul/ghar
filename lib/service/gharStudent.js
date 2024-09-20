const { zohoDataSTudent } = require("../helpers/zohotoken");

class ZohoCalculation {
  async getStudentsByEmail(student_email) {
    try {
      const params = {
        criteria: `Navgurukul_Email == "${student_email}"`,
      };
      const getStudents = "All_Students";
      const studentsData = await zohoDataSTudent(getStudents, params);
      console.log(studentsData);
      return studentsData;
    } catch (error) {
      console.error("Error fetching students:", error);
      return error;
    }
  }
}

module.exports = new ZohoCalculation();
