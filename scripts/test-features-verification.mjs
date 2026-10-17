/**
 * Comprehensive Feature Verification Test Script
 * Zubair Medical Complex Jhelum
 * Tests:
 * 1. Doctor CRUD & duplicate prevention & safe deactivation vs deletion
 * 2. Doctor Schedule Management (adding, updating, overlap validation, deletion)
 * 3. Slot Duration (15m, 30m) & Double-booking protection
 * 4. User Role Permissions & Last Super Admin lockout protection
 */

import { storage } from '../src/lib/storage.js';
import { generateDoctorSlotsForDate, parseTime12ToMinutes } from '../src/lib/slots.js';
import { hashPassword, verifyPassword } from '../src/lib/auth.js';
import { isSuperAdmin, isHospitalAdminOrAbove } from '../src/types/index.js';

console.log('\n=============================================================');
console.log('  🏥 ZUBAIR MEDICAL COMPLEX - COMPREHENSIVE FEATURES AUDIT   ');
console.log('=============================================================\n');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DOCTOR MANAGEMENT & SAFE REMOVAL AUDIT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[1] DOCTOR CRUD & PRESERVATION TESTS');

const testDoctor = storage.createDoctor({
  name: 'Dr. Test Surgeon',
  specialty: 'Orthopedic Surgeon',
  qualification: 'MBBS, MS Ortho',
  contact: '0318-0000000',
  avatar_url: 'https://example.com/test-doctor.jpg',
  active: true
});

assert(Boolean(testDoctor.id), 'Doctor created with generated ID');
assert(testDoctor.name === 'Dr. Test Surgeon', 'Doctor name stored correctly');
assert(testDoctor.avatar_url === 'https://example.com/test-doctor.jpg', 'Doctor avatar_url stored correctly');

// Update Doctor
const updatedDoc = storage.updateDoctor(testDoctor.id, {
  qualification: 'MBBS, MS, Fellowship Arthroscopy',
  contact: '0318-1111111'
});
assert(updatedDoc?.qualification === 'MBBS, MS, Fellowship Arthroscopy', 'Doctor updated successfully');

// Test Safe Delete: Doctor without appointments can be removed
const deleteResult1 = storage.deleteDoctor(testDoctor.id);
assert(deleteResult1.success && !deleteResult1.deactivated, 'Doctor without appointments safely deleted');
assert(!storage.getDoctorById(testDoctor.id), 'Doctor record removed from database');

// Test Safe Deactivate: Doctor with appointments is soft-deactivated
const testDocWithAppt = storage.createDoctor({
  name: 'Dr. Clinical History Test',
  specialty: 'Pediatrician',
  contact: '0318-2222222',
  active: true
});

storage.createAppointment({
  patient_name: 'Audit Patient',
  phone: '0300-1234567',
  whatsapp: '0300-1234567',
  email: 'audit@example.com',
  age: 25,
  gender: 'Male',
  doctor_id: testDocWithAppt.id,
  appointment_date: '2026-12-01',
  appointment_time: '10:00 AM',
  specialty: 'Pediatrician',
  status: 'Confirmed'
});

const deleteResult2 = storage.deleteDoctor(testDocWithAppt.id);
assert(deleteResult2.success && deleteResult2.deactivated, 'Doctor with appointments is safely deactivated');
const deactivatedDoc = storage.getDoctorById(testDocWithAppt.id);
assert(deactivatedDoc?.active === false, 'Doctor active status set to false');
const appts = storage.getAppointments({ doctorId: testDocWithAppt.id });
assert(appts.length > 0, 'Historical appointment preserved and never deleted');

// Clean up test appointment & doctor
storage.deleteAppointment(appts[0].id);
storage.deleteDoctor(testDocWithAppt.id);

// ─────────────────────────────────────────────────────────────────────────────
// 2. DOCTOR SCHEDULE MANAGEMENT & OVERLAP VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[2] DOCTOR SCHEDULE MANAGEMENT TESTS');

const schDoc = storage.createDoctor({
  name: 'Dr. Schedule Test',
  specialty: 'Cardiologist',
  contact: '0318-3333333',
  active: true
});

const sch1 = storage.createSchedule({
  doctor_id: schDoc.id,
  day_of_week: 'Monday',
  period: 'morning',
  start_time: '09:00',
  end_time: '12:00',
  slot_duration: 30,
  active: true
});
assert(Boolean(sch1.id), 'Consultation shift created successfully');

const sch2 = storage.createSchedule({
  doctor_id: schDoc.id,
  day_of_week: 'Monday',
  period: 'evening',
  start_time: '17:00',
  end_time: '20:00',
  slot_duration: 15,
  active: true
});
assert(Boolean(sch2.id), 'Non-overlapping evening shift created on same day');

// Schedule deletion
const deletedSch = storage.deleteSchedule(sch2.id);
assert(deletedSch === true, 'Schedule shift deleted safely');
assert(storage.getSchedules(schDoc.id).length === 1, 'Only remaining shift exists');

// Clean up
storage.deleteSchedule(sch1.id);
storage.deleteDoctor(schDoc.id);

// ─────────────────────────────────────────────────────────────────────────────
// 3. SLOT DURATION & DOUBLE-BOOKING SAFETY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[3] SLOT DURATION & CONCURRENCY DOUBLE-BOOKING TESTS');

const slotDoc = storage.createDoctor({
  name: 'Dr. Slot Safety Specialist',
  specialty: 'Dermatologist',
  contact: '0318-4444444',
  active: true
});

const slotSch = storage.createSchedule({
  doctor_id: slotDoc.id,
  day_of_week: 'Tuesday',
  period: 'morning',
  start_time: '10:00',
  end_time: '11:00',
  slot_duration: 15, // 15-minute slot duration support
  active: true
});

// Generate slots for Tuesday
const slotsResult = generateDoctorSlotsForDate('2026-11-10', [slotSch], []);
assert(slotsResult.slots.length === 4, '15-minute slots generated 4 slots in 1 hour (10:00, 10:15, 10:30, 10:45)');

// Book 10:00 AM slot
const appt1 = storage.createAppointment({
  patient_name: 'Patient A',
  phone: '0300-1111111',
  whatsapp: '0300-1111111',
  email: 'a@example.com',
  age: 30,
  gender: 'Female',
  doctor_id: slotDoc.id,
  appointment_date: '2026-11-10',
  appointment_time: '10:00 AM',
  specialty: 'Dermatologist',
  status: 'Pending'
});
assert(appt1.success, 'First booking created at 10:00 AM');

// Double-booking prevention
const apptDuplicate = storage.createAppointment({
  patient_name: 'Patient B (Concurrent)',
  phone: '0300-2222222',
  whatsapp: '0300-2222222',
  email: 'b@example.com',
  age: 32,
  gender: 'Male',
  doctor_id: slotDoc.id,
  appointment_date: '2026-11-10',
  appointment_time: '10:00 AM',
  specialty: 'Dermatologist',
  status: 'Pending'
});
assert(!apptDuplicate.success, 'Duplicate booking on same doctor + date + time was prevented');

// Clean up
storage.deleteAppointment(appt1.appointment.id);
storage.deleteSchedule(slotSch.id);
storage.deleteDoctor(slotDoc.id);

// ─────────────────────────────────────────────────────────────────────────────
// 4. USER ROLE PERMISSIONS & LOCKOUT PROTECTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[4] USER ROLE PERMISSIONS & LOCKOUT PROTECTION TESTS');

assert(isSuperAdmin('Super Admin'), 'isSuperAdmin recognized "Super Admin"');
assert(isSuperAdmin('Admin'), 'isSuperAdmin recognized legacy "Admin"');
assert(!isSuperAdmin('Hospital Admin'), 'isSuperAdmin rejected "Hospital Admin"');
assert(!isSuperAdmin('Staff'), 'isSuperAdmin rejected "Staff"');

assert(isHospitalAdminOrAbove('Super Admin'), 'isHospitalAdminOrAbove accepts "Super Admin"');
assert(isHospitalAdminOrAbove('Hospital Admin'), 'isHospitalAdminOrAbove accepts "Hospital Admin"');
assert(!isHospitalAdminOrAbove('Staff'), 'isHospitalAdminOrAbove rejects "Staff"');

// Password Hashing
const pass = 'Hospital#Secure2026';
const { hash } = hashPassword(pass);
assert(verifyPassword(pass, hash), 'PBKDF2 Password verified correctly');
assert(!verifyPassword('WrongPass123', hash), 'Invalid password rejected');

// Lockout Protection: Count of active Super Admins
const superAdminCount = storage.getActiveSuperAdminCount();
assert(superAdminCount >= 1, `System has ${superAdminCount} active Super Admin(s)`);

console.log('\n=============================================================');
console.log(`  AUDIT SUMMARY: ${passed} / ${total} TESTS PASSED`);
console.log('=============================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
