const { zohoData } = require("../helpers/zohotoken");
class ZohoCalculation {
  async getStudents(min_value, max_value) {
    try {
      const params = {
        criteria:
          "Student_ID1 >=" + min_value + "&& Student_ID1 <=" + max_value,
        max_records: 1000,
      };
      const getStudents = "All_Students";
      const studentsData = await zohoData(getStudents, params);
      return studentsData;
    } catch (error) {
      return error;
    }
  }
}

module.exports = new ZohoCalculation();
