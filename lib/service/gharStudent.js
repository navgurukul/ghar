const { zohoDataSTudent, zohoData } = require("../helpers/zohotoken");

class ZohoCalculation {
  async getStudentsByEmail(student_email) {
    try {
      const params = {
        criteria: `Navgurukul_Email == "${student_email}"`,
      };
      const getStudents = "Ghar_Student_Usage_Report";
      const studentsData = await zohoData(getStudents, params);
      return studentsData;
    } catch (error) {
      console.error("Error fetching students:", error);
      return error;
    }
  }

  async getCampuses() {
    try {
      const getCampuses = "All_Campuses1";
      const campusesData = await zohoData(getCampuses);
      return campusesData;
    } catch (error) {
      console.error("Error fetching campuses:", error);
      return error;
    }
  }

  async getSchoolsBasedOnCampus(campus) {
    try {
      const campusData = await this.getCampuses();
      let campusId;
      for (let campusName of campusData.data) {
        if (campusName.Campus_Name == campus) {
          campusId = campusName.ID;
          break;
        }
      }
      const params = {
        criteria: `Campuses == ${campusId}`,
      };
      const getSchools = "Assign_School_to_Campus_Report";
      const schoolsData = await zohoData(getSchools, params);
      return schoolsData;
    } catch (error) {
      console.error("Error fetching schools:", error);
      return error;
    }
  }
}

module.exports = new ZohoCalculation();
