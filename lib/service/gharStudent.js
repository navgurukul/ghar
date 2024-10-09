const {
  zohoDataSTudent,
  zohoData,
  updateGhrStd,
  insertGhrStd,
} = require("../helpers/zohotoken");

class gharStudents {
  async getStudentsByEmail(student_email) {
    try {
      const params = {
        criteria: `Navgurukul_Email == "${student_email}"`,
      };
      const getStudents = "Ghar_Student_Report";
      const studentsData = await zohoDataSTudent(getStudents, params);
      return studentsData;
    } catch (error) {
      console.error("Error fetching students:", error);
      return error;
    }
  }

  async getCampuses() {
    try {
      const getCampuses = "All_Campuses1";
      const campusesData = await zohoDataSTudent(getCampuses);
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
      const schoolsData = await zohoDataSTudent(getSchools, params);
      return schoolsData;
    } catch (error) {
      console.error("Error fetching schools:", error);
      return error;
    }
  }

  async updateGrFrmGrStd(recordId, upData) {
    try {
      const updateData = {
        data: [
          {
            Name: {
              first_name: upData["Name_first_name"],
              last_name: upData["Name_last_name"],
            },
            Mother_s_Name: {
              first_name: upData["Mother_s_Name_first_name"],
              last_name: upData["Mother_s_Name_last_name"],
            },
            Father_s_Name: {
              first_name: upData["Father_s_Name_first_name"],
              last_name: upData["Father_s_Name_last_name"],
            },
            Father_s_Phone_No: upData["Father_s_Phone_No"],
            Mother_s_Phone_No: upData["Mother_s_Phone_No"],
            Personal_Email: upData["Personal_Email"],
            Campus_Name: upData["Campus_Name"],
            Admission_Test_mode: upData["Admission_Test_mode"],
            Upload_Aadhar: upData["Upload_Aadhar"],
            Marital_Status: upData["Marital_Status"],
            Date_of_Birth: upData["Date_of_Birth"],
            Photo: upData["Photo"],
            Phone_Number: upData["Phone_Number"],
            Admission_Test_Score: upData["Admission_Test_Score"],
            Gender: upData["Gender"],
            School_Name: upData["School_Name"],
            Aadhar_No: upData["Aadhar_No"],
            Discord_User_ID: upData["Discord_User_ID"],
            Status: upData["Status"],
            Qualification1: upData["Qualification1"],
            Religion: upData["Religion"],
            Caste: upData["Caste"],
            Admission_Test_Email: upData["Admission_Test_Email"],
            Address: {
              address_line_1: upData["Address_address_line_1"],
              district_city: upData["Address_district_city"],
              state_province: upData["Address_state_province"],
              postal_Code: upData["Address_postal_Code"],
            },
          },
        ],
      };
      const getStudents = "Ghar_Student_Report";
      const studentsData = await updateGhrStd(
        getStudents,
        updateData,
        recordId
      );
      return studentsData;
    } catch (error) {
      console.error("Error fetching students:", error);
      return error;
    }
  }

  async insertGrFrmGrStd(ele) {
    const campusData = await this.getCampuses();
    const campusId = campusData.data.find(
      (item) => item.Campus_Name === ele.Campus_Name
    );
    let payload = {
      data: [
        {
          Navgurukul_Email: ele.Navgurukul_Email,
          Personal_Email: ele.Personal_Email,
          Gender: ele.Gender,
          Name: {
            last_name: ele.Name_first_name,
            first_name: ele.Name_last_name,
          },
          Select_Campus: campusId.ID,
          Select_School1: ele.School_Name,
          Admission_Test_mode: ele.Admission_Test_mode,
          Marital_status: ele.Marital_status,
          Status: ele.Status,
          Joining_Date: ele.Joining_Date,
          Religion: ele.Religion,
          Qualification: ele.Qualification,
          Caste: ele.Caste,
          Admission_Test_Email: ele.Admission_Test_Email,
          Discord_User_Id: ele.Discord_User_Id,
          Photo: ele.Photo,
          Admission_Test_Score: ele.Admission_Test_Score,
          Date_of_Birth: ele.Date_of_Birth,
          Phone_Number: ele.Phone_Number,
          Emergency_Phone: ele.Emergency_Phone,
          Aadhar_No: ele.Aadhar_No,
          Upload_Aadhar: ele.Upload_Aadhar,
          Father_s_Phone: ele.Father_s_Phone,
          Mother_s_Phone: ele.Mother_s_Phone,
          Father_s_Name: {
            last_name: ele.Father_Name_last_name,
            first_name: ele.Father_Name_first_name,
          },
          Mother_s_Name: {
            last_name: ele.Mother_Name_last_name,
            first_name: ele.Mother_Name_first_name,
          },
        },
      ],
    };
    try {
      const response = await insertGhrStd("Add_Student", payload);
      return response;
    } catch (error) {
      console.error("Error in insertGrFrmGrStd:", error);
    }
  }
}

module.exports = new gharStudents();
