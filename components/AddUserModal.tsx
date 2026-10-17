'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { User } from '@/lib/types';

type AddMode = 'main' | 'member';

const MIN_DISTINCT_RAVISABHAS_FOR_KUTUMB = 3;

interface Candidate extends User {
  attendanceCount: number;
  eligible: boolean;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (user: User) => void;
  initialFirstName?: string;
  editUser?: User | null;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
  initialFirstName = '',
  editUser = null,
}: AddUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: editUser?.firstName || initialFirstName,
    middleName: '',
    lastName: editUser?.lastName || '',
    smkNo: editUser?.smkNo || '',
    mobileNo: editUser?.mobileNo || '',
    gender: editUser?.gender || '1',
    age: '',
    presentVillageEng: '',
    addressDescription: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<AddMode>('main');
  const [lookupQuery, setLookupQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mainPersons, setMainPersons] = useState<User[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedMainPerson, setSelectedMainPerson] = useState<User | null>(null);
  const [existingKutumbMain, setExistingKutumbMain] = useState<User | null>(null);
  const isEditMode = !!editUser;

  // Populate form when editing
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (editUser) {
        try {
          const { data } = await axios.get(`/api/users/${editUser.id}`);
          const user = data.user;
          setFormData({
            firstName: user.firstName || '',
            middleName: user.middleName || '',
            lastName: user.lastName || '',
            smkNo: user.smkNo || '',
            mobileNo: user.mobileNo || '',
            gender: user.gender || '1',
            age: user.age?.toString() || '',
            presentVillageEng: user.presentVillageEng || '',
            addressDescription: user.addressDescription || '',
          });
        } catch (error) {
          console.error('Error fetching user details:', error);
          // Fallback to editUser data
          setFormData({
            firstName: editUser.firstName || '',
            middleName: '',
            lastName: editUser.lastName || '',
            smkNo: editUser.smkNo || '',
            mobileNo: editUser.mobileNo || '',
            gender: editUser.gender || '1',
            age: '',
            presentVillageEng: '',
            addressDescription: '',
          });
        }
      } else if (initialFirstName) {
        setFormData({
          firstName: initialFirstName,
          middleName: '',
          lastName: '',
          smkNo: '',
          mobileNo: '',
          gender: '1',
          age: '',
          presentVillageEng: '',
          addressDescription: '',
        });
      }
    };

    fetchUserDetails();
  }, [editUser, initialFirstName]);

  useEffect(() => {
    if (isEditMode || lookupQuery.trim().length < 2) {
      setCandidates([]);
      setMainPersons([]);
      setExistingKutumbMain(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        if (mode === 'main') {
          const { data } = await axios.get('/api/users/candidates', {
            params: { query: lookupQuery },
          });
          setCandidates(data.candidates || []);
          setExistingKutumbMain(data.existingKutumbMain || null);
          setMainPersons([]);
        } else {
          const { data } = await axios.get('/api/users/households', {
            params: { query: lookupQuery },
          });
          setMainPersons(data.mainPersons || []);
          setCandidates([]);
          setExistingKutumbMain(null);
        }
      } catch {
        setCandidates([]);
        setMainPersons([]);
        setExistingKutumbMain(null);
      } finally {
        setIsLookingUp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isEditMode, lookupQuery, mode]);

  const emptyPersonalForm = {
    firstName: '',
    middleName: '',
    lastName: '',
    smkNo: '',
    mobileNo: '',
    gender: '1',
    age: '',
    presentVillageEng: '',
    addressDescription: '',
  };

  const resetSelection = (nextMode: AddMode) => {
    setMode(nextMode);
    setLookupQuery('');
    setCandidates([]);
    setMainPersons([]);
    setSelectedCandidate(null);
    setSelectedMainPerson(null);
    setExistingKutumbMain(null);
    setError('');
    setFormData(emptyPersonalForm);
  };

  const clearKutumbContext = () => {
    setSelectedMainPerson(null);
    setLookupQuery('');
    setMainPersons([]);
    setError('');
    setFormData(emptyPersonalForm);
  };

  useEffect(() => {
    if (!isOpen && !isEditMode) {
      resetSelection('main');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal closes
  }, [isOpen, isEditMode]);

  const selectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setLookupQuery('');
    setCandidates([]);
    setFormData({
      firstName: candidate.firstName,
      middleName: candidate.middleName || '',
      lastName: candidate.lastName,
      smkNo: candidate.smkNo,
      mobileNo: candidate.mobileNo,
      gender: candidate.gender || '1',
      age: candidate.age?.toString() || '',
      presentVillageEng: candidate.presentVillageEng || '',
      addressDescription: candidate.addressDescription || '',
    });
  };

  const selectMainPerson = (person: User) => {
    setSelectedMainPerson(person);
    setLookupQuery('');
    setMainPersons([]);
  };

  const openFamilyMemberForMain = (person: User) => {
    setMode('member');
    setSelectedCandidate(null);
    setCandidates([]);
    setExistingKutumbMain(null);
    setSelectedMainPerson(person);
    setLookupQuery('');
    setMainPersons([]);
    setError('');
    setFormData(emptyPersonalForm);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }
    if (!isEditMode && mode === 'main' && !selectedCandidate) {
      setError('Select an existing Non-SMK candidate');
      return;
    }
    if (!isEditMode && mode === 'main' && !selectedCandidate?.eligible) {
      setError(
        `Main person must have attendance at at least ${MIN_DISTINCT_RAVISABHAS_FOR_KUTUMB} distinct ravisabhas`
      );
      return;
    }
    if (!isEditMode && mode === 'member' && !selectedMainPerson) {
      setError('Select a household main person');
      return;
    }

    setIsLoading(true);

    try {
      let data;
      if (isEditMode) {
        const response = await axios.put(`/api/users/${editUser.id}`, formData);
        data = response.data;
      } else {
        const response = await axios.post('/api/users', {
          ...formData,
          mode,
          candidateId: selectedCandidate?.id,
          mainPersonId: selectedMainPerson?.id,
        });
        data = response.data;
      }
      onUserAdded(data.user);

      if (!isEditMode && mode === 'main') {
        const kutumbLabel =
          data.user.kutumbId != null ? ` (Kutumb ${data.user.kutumbId})` : '';
        toast.success(
          data.message ||
            `Kutumb created successfully${kutumbLabel}. Add family members below.`
        );
        setMode('member');
        setSelectedMainPerson(data.user);
        setFormData(emptyPersonalForm);
        setSelectedCandidate(null);
        setLookupQuery('');
        setCandidates([]);
        setMainPersons([]);
      } else if (!isEditMode && mode === 'member') {
        toast.success(
          data.message ||
            `Family member added to Kutumb ${selectedMainPerson?.kutumbId ?? ''}. Add another or clear Kutumb when done.`.trim()
        );
        setFormData(emptyPersonalForm);
      } else {
        setFormData(emptyPersonalForm);
        onClose();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to add user. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode
                ? 'Edit User'
                : mode === 'main'
                  ? 'Create Non-SMK Kutumb'
                  : 'Add Family Member'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {!isEditMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => resetSelection('main')}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    mode === 'main'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Main Person
                </button>
                <button
                  type="button"
                  onClick={() => resetSelection('member')}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    mode === 'member'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Family Member
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {mode === 'main'
                    ? 'Search existing Non-SMK candidate'
                    : 'Search household main person'}
                </label>
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(event) => setLookupQuery(event.target.value)}
                  placeholder={
                    mode === 'main'
                      ? 'Name, mobile, or Non-SMK ID'
                      : 'Name, mobile, or Kutumb ID'
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
                {isLookingUp && (
                  <p className="mt-2 text-xs text-gray-500">Searching...</p>
                )}
                {(candidates.length > 0 || mainPersons.length > 0) && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    {mode === 'main'
                      ? candidates.map((candidate) => (
                          <button
                            type="button"
                            key={candidate.id}
                            onClick={() => selectCandidate(candidate)}
                            className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-2 text-left last:border-0 hover:bg-gray-50"
                          >
                            <span>
                              <span className="block text-sm font-medium text-gray-900">
                                {candidate.firstName} {candidate.middleName} {candidate.lastName}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {candidate.smkNo} · {candidate.mobileNo || 'No mobile'}
                              </span>
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                candidate.eligible
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {candidate.attendanceCount}/{MIN_DISTINCT_RAVISABHAS_FOR_KUTUMB}
                            </span>
                          </button>
                        ))
                      : mainPersons.map((person) => (
                          <button
                            type="button"
                            key={person.id}
                            onClick={() => selectMainPerson(person)}
                            className="w-full border-b border-gray-100 px-3 py-2 text-left last:border-0 hover:bg-gray-50"
                          >
                            <span className="block text-sm font-medium text-gray-900">
                              {person.firstName} {person.middleName} {person.lastName}
                            </span>
                            <span className="block text-xs text-gray-500">
                              Kutumb {person.kutumbId} · {person.mobileNo || 'No mobile'}
                            </span>
                          </button>
                        ))}
                  </div>
                )}
                {!isLookingUp &&
                  lookupQuery.trim().length >= 2 &&
                  mode === 'main' &&
                  candidates.length === 0 && (
                    <div className="mt-2">
                      {existingKutumbMain ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          <p>
                            <span className="font-medium">
                              {existingKutumbMain.firstName}{' '}
                              {existingKutumbMain.lastName}
                            </span>{' '}
                            already has Kutumb{' '}
                            <span className="font-medium">
                              {existingKutumbMain.kutumbId}
                            </span>
                            . Promoted people are not listed as candidates—use
                            Family Member to add relatives.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              openFamilyMemberForMain(existingKutumbMain)
                            }
                            className="mt-2 text-sm font-medium text-amber-950 underline hover:no-underline"
                          >
                            Switch to Family Member for this Kutumb
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No Non-SMK candidates match this search. They may
                          already have a Kutumb, or need more ravisabha
                          attendance before creating one.
                        </p>
                      )}
                    </div>
                  )}
                {!isLookingUp &&
                  lookupQuery.trim().length >= 2 &&
                  mode === 'member' &&
                  mainPersons.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      No Kutumb main person found. Create a Kutumb under Main
                      Person first, or search by Kutumb ID.
                    </p>
                  )}
              </div>

              {selectedCandidate && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    selectedCandidate.eligible
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  Selected {selectedCandidate.firstName} {selectedCandidate.lastName}.
                  Attendance: {selectedCandidate.attendanceCount} distinct ravisabhas.
                  {selectedCandidate.eligible
                    ? ' Eligible to create a Kutumb.'
                    : ` At least ${MIN_DISTINCT_RAVISABHAS_FOR_KUTUMB} are required.`}
                </div>
              )}

              {selectedMainPerson && (
                <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Adding members to Kutumb{' '}
                    <span className="font-semibold">
                      {selectedMainPerson.kutumbId}
                    </span>
                    , main person {selectedMainPerson.firstName}{' '}
                    {selectedMainPerson.lastName}.
                  </p>
                  <button
                    type="button"
                    onClick={clearKutumbContext}
                    className="shrink-0 text-sm font-medium text-blue-900 underline hover:no-underline"
                  >
                    Clear Kutumb
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter middle name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="0"
                  max="150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile No
                </label>
                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>

              {(isEditMode || mode !== 'member') && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Present Village
                  </label>
                  <input
                    type="text"
                    name="presentVillageEng"
                    value={formData.presentVillageEng}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter present village"
                  />
                </div>
              )}

              {(isEditMode || mode !== 'member') && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="addressDescription"
                    value={formData.addressDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full address"
                  />
                </div>
              )}

              {/* <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMK No <span className="text-gray-500 text-xs">(Optional - Auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  name="smkNo"
                  value={formData.smkNo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Non_PJP_15112025 (leave empty for auto-generation)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: Non_[FirstInitial][MiddleInitial][LastInitial]_[DDMMYYYY]
                </p>
              </div> */}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                (!isEditMode &&
                  mode === 'main' &&
                  (!selectedCandidate || !selectedCandidate.eligible)) ||
                (!isEditMode &&
                  mode === 'member' &&
                  !selectedMainPerson?.id)
              }
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {isEditMode
                    ? 'Update User'
                    : mode === 'main'
                      ? 'Create Kutumb'
                      : 'Add Family Member'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
