const {
  zohoDataSTudent,
  zohoData,
  updateGhrStd,
  insertGhrStd,
  uploadFile,
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

  async uploadFileIfExists(reportName, recordId, fieldName, filePath, email) {
    if (filePath) {
      try {
        const uploadResponse = await uploadFile(
          reportName,
          recordId,
          fieldName,
          filePath
        );
        return {
          message: `Successfully Uploaded ${fieldName} file for ${email}`,
        };
      } catch (error) {
        console.error(`Error uploading ${fieldName} file:`, error.message);
        throw new Error(`Failed to upload ${fieldName} file for ${email}`);
      }
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
            Marital_Status: upData["Marital_Status"],
            Date_of_Birth: upData["Date_of_Birth"],
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
      const filesToUpload = [
        { fieldName: "Photo", filePath: upData["Photo"] },
        { fieldName: "Upload_Aadhar", filePath: upData["Upload_Aadhar"] },
      ];

      for (const file of filesToUpload) {
        await this.uploadFileIfExists(
          getStudents,
          recordId,
          file.fieldName,
          file.filePath,
          upData["Navgurukul_Email"]
        );
      }
      return {
        message: `Successfully updated student record ${recordId} and uploaded associated files.`,
        updateData: studentsData,
        updateFile: filesToUpload,
      };
    } catch (error) {
      console.error("Error fetching students:", error);
      return error;
    }
  }

  async insertGrFrmGrStd(ele) {
    const campusData = await this.getCampuses();
    const campus = campusData.data.find(
      (item) => item.Campus_Name === ele.Campus_Name
    );
    if (!campus) {
      throw new Error(`Campus with name ${ele.Campus_Name} not found`);
    }
    const campusId = campus.ID;
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
          Select_Campus: campusId,
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
          Admission_Test_Score: ele.Admission_Test_Score,
          Date_of_Birth: ele.Date_of_Birth,
          Phone_Number: ele.Phone_Number,
          Emergency_Phone: ele.Emergency_Phone,
          Aadhar_No: ele.Aadhar_No,
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
          Address: {
            address_line_1: ele.Address_address_line_1,
            district_city: ele.Address_district_city,
            state_province: ele.Address_state_province,
            postal_Code: ele.Address_postal_Code,
          },
        },
      ],
    };
    try {
      const responseData = await insertGhrStd("Add_Student", payload);
      if (responseData.code === 3000) {
        const reportName = "Ghar_Student_Report";
        const getStudent = await zohoDataSTudent(reportName, {
          criteria: `Navgurukul_Email == "${ele.Navgurukul_Email}"`,
        });
        const recordId = getStudent.data[0].ID;

        const filesToUpload = [
          { fieldName: "Photo", filePath: ele.Photo },
          { fieldName: "Upload_Aadhar", filePath: ele.Upload_Aadhar },
        ];

        for (const file of filesToUpload) {
          await this.uploadFileIfExists(
            reportName,
            recordId,
            file.fieldName,
            file.filePath,
            ele.Navgurukul_Email
          );
        }
      }
      return responseData;
    } catch (error) {
      console.error("Error in insertGrFrmGrStd:", error);
    }
  }
}

module.exports = new gharStudents();
