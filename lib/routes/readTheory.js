const readTheoryService = require('../service/readTheory');

module.exports = [
  {
    method: 'GET',
    path: '/get/ReadTheory-classData',
    options: {
      description:'Retrieve ReadTheory class data',
      tags: ['api'],
    },
    handler: async (request, h) => {
      try {
        const classData = await readTheoryService.fetchClassesListJson();
        return h.response(classData).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'GET',
    path: '/get/ReadTheory-studentList',
    options: {
      description: 'Retrieve a list of students associated with the teacher from ReadTheory',
      tags: ['api'],
    },
    handler: async (request, h) => {
      try {
        const studentList = await readTheoryService.fetchStudentData();
        return h.response(studentList).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
]  