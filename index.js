const xlsx = require('xlsx');
const fs = require('fs');

const hasWorkedConsecutiveDays = (shifts, days) => {
  let consecutiveDays = 1;
  shifts.sort((a, b) => a.startTime - b.startTime);
  for (let i = 1; i < shifts.length; i++) {
    let prevDay = new Date(shifts[i - 1].startTime);
    prevDay.setDate(prevDay.getDate() + 1);

    if (
      prevDay.toISOString().split('T')[0] ===
      shifts[i].startTime.toISOString().split('T')[0]
    ) {
      consecutiveDays++;
      if (consecutiveDays >= days) return true;
    } else {
      consecutiveDays = 1;
    }
  }
  return false;
};

const hasShortGapBetweenShifts = (shifts, maxHours, minHours) => {
  shifts.sort((a, b) => a.startTime - b.startTime);
  for (let i = 1; i < shifts.length; i++) {
    let gap = (shifts[i].startTime - shifts[i - 1].endTime) / (1000 * 60 * 60);
    if (gap < maxHours && gap > minHours) return true;
  }
  return false;
};

const hasLongShift = (shifts, hours) => {
  for (let shift of shifts) {
    let duration = (shift.endTime - shift.startTime) / (1000 * 60 * 60);
    if (duration > hours) return true;
  }
  return false;
};

const writeOutputToFile = (fileName, content) => {
  fs.writeFile(fileName, content, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log(`Output written to ${fileName}`);
    }
  });
};

fs.readFile('Assignment_Timecard.xlsx', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const workbook = xlsx.read(data);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(worksheet);

  const employeeShifts = {};

  json.forEach((row) => {
    const employeeName = row['Employee Name'];
    const startTime = new Date(row['Time']);
    const endTime = new Date(row['Time Out']);

    if (!employeeShifts[employeeName]) {
      employeeShifts[employeeName] = [];
    }

    employeeShifts[employeeName].push({ startTime, endTime });
  });

  // Analyze shifts for each condition separately
  const consecutiveDaysResults = analyzeConsecutiveDays(employeeShifts);
  const shortGapsResults = analyzeShortGaps(employeeShifts);
  const longShiftsResults = analyzeLongShifts(employeeShifts);

  // Printing results separately
  setTimeout(() => {
    console.log('\nEmployees who worked for 7 consecutive days:');
    printResults(consecutiveDaysResults);
  }, 1000); // 1000 milliseconds delay

  setTimeout(() => {
    console.log(
      '\nEmployees who have less than 10 hours but more than 1 hour of time between shifts:'
    );
    printResults(shortGapsResults);
  }, 2000); // 2000 milliseconds delay

  setTimeout(() => {
    console.log(
      'Number of employees who have worked more than 14 hours in a single shift:',
      longShiftsResults.length
    );
    console.log(
      '\nEmployees who have worked for more than 14 hours in a single shift:'
    );
    printResults(longShiftsResults);
    // Write complete output to file
    const completeOutput = `
Employees who worked for 7 consecutive days:
${consecutiveDaysResults.join('\n')}

Employees who have less than 10 hours but more than 1 hour of time between shifts:
${shortGapsResults.join('\n')}

Number of employees who have worked more than 14 hours in a single shift: ${
      longShiftsResults.length
    }
Employees who have worked for more than 14 hours in a single shift:
${longShiftsResults.join('\n')}
`;

    writeOutputToFile('output.txt', completeOutput);
  }, 3000); // 3000 milliseconds delay
});

// Analyzing for 7 consecutive days
const analyzeConsecutiveDays = (employeeShifts) => {
  const results = Object.keys(employeeShifts).filter((employee) =>
    hasWorkedConsecutiveDays(employeeShifts[employee], 7)
  );
  return results.length > 0
    ? results
    : ['No employees worked for 7 consecutive days.'];
};

// Analyzing for short gaps between shifts
const analyzeShortGaps = (employeeShifts) => {
  const results = Object.keys(employeeShifts).filter((employee) =>
    hasShortGapBetweenShifts(employeeShifts[employee], 10, 1)
  );
  return results.length > 0
    ? results
    : ['No employees have short gaps between shifts.'];
};

// Analyzing for long shifts
const analyzeLongShifts = (employeeShifts) => {
  const results = Object.keys(employeeShifts).filter((employee) =>
    hasLongShift(employeeShifts[employee], 14)
  );
  return results.length > 0
    ? results
    : ['No employees have worked for more than 14 hours in a single shift.'];
};

// Print results
const printResults = (results) => {
  results.forEach((employee) => {
    console.log(employee);
  });
};
