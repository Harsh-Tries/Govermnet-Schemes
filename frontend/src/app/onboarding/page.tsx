'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  User,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  MapPin,
  GraduationCap,
  Tractor,
  HeartHandshake,
  Store,
  Accessibility,
  Users,
  Briefcase,
  Hammer,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import {
  registerCitizen,
  loginCitizen,
  authStorage,
  UserSession
} from '../../services/authApi';
import {
  saveOnboardingStep,
  fetchProfile,
  UserProfileData
} from '../../services/profileApi';
import {
  MAHARASHTRA_DISTRICTS,
  SOCIAL_CATEGORIES,
  EDUCATION_LEVELS,
  OCCUPATION_OPTIONS,
  BENEFICIARY_CATEGORIES
} from '../../data/maharashtraData';

export default function OnboardingPage() {
  const router = useRouter();

  // Current Step (1: Welcome/Name, 2: Auth, 3: Residency, 4: Personal, 5: Beneficiary/Conditional, 6: Completed)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authenticated state
  const [session, setSession] = useState<UserSession | null>(null);

  // Step 1: Welcome & Name
  const [fullName, setFullName] = useState<string>('');

  // Step 2: Auth
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Step 3: Maharashtra Residency
  const [stateCode, setStateCode] = useState<string>('IN-MH');
  const [isMhResident, setIsMhResident] = useState<boolean>(true);
  const [district, setDistrict] = useState<string>('Pune');
  const [taluka, setTaluka] = useState<string>('');
  const [villageCity, setVillageCity] = useState<string>('');
  const [residencyArea, setResidencyArea] = useState<string>('Urban');

  // Step 4: Personal Profile
  const [age, setAge] = useState<number>(21);
  const [gender, setGender] = useState<string>('MALE');
  const [maritalStatus, setMaritalStatus] = useState<string>('SINGLE');
  const [income, setIncome] = useState<number>(200000);
  const [casteCategory, setCasteCategory] = useState<string>('OBC');
  const [educationLevel, setEducationLevel] = useState<string>('UNDERGRADUATE');
  const [occupation, setOccupation] = useState<string>('STUDENT');
  const [isPwd, setIsPwd] = useState<boolean>(false);
  const [disabilityPercentage, setDisabilityPercentage] = useState<number>(40);

  // Step 5: Beneficiary Categories & Conditionals
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['STUDENTS']);

  // Conditional Sub-forms
  const [studentCourse, setStudentCourse] = useState<string>('B.Tech / Engineering');
  const [studentInstitutionType, setStudentInstitutionType] = useState<string>('GOVERNMENT_AIDED');
  const [studentYear, setStudentYear] = useState<string>('3rd Year');
  const [studentScholarshipInterests, setStudentScholarshipInterests] = useState<string[]>([
    'Tuition Fee Reimbursement',
    'Hostel Maintenance Allowance'
  ]);

  const [farmerLandCategory, setFarmerLandCategory] = useState<string>('Small (1 to 2 Hectares)');
  const [farmerAcres, setFarmerAcres] = useState<number>(2.5);
  const [farmerIrrigation, setFarmerIrrigation] = useState<string>('Drip / Micro Irrigation');
  const [farmerCrops, setFarmerCrops] = useState<string>('Cotton, Soybean');

  const [entrepreneurStage, setEntrepreneurStage] = useState<string>('Existing Micro Enterprise');
  const [entrepreneurSector, setEntrepreneurSector] = useState<string>('Services / IT & Tech');
  const [entrepreneurInvestment, setEntrepreneurInvestment] = useState<string>('₹5 Lakhs to ₹10 Lakhs');
  const [entrepreneurUdyam, setEntrepreneurUdyam] = useState<string>('Registered');

  const [udidStatus, setUdidStatus] = useState<string>('Have UDID Card');
  const [disabilityType, setDisabilityType] = useState<string>('Locomotor Disability');

  const [isHeadOfHousehold, setIsHeadOfHousehold] = useState<boolean>(false);
  const [isSingleMother, setIsSingleMother] = useState<boolean>(false);
  const [shgMember, setShgMember] = useState<boolean>(true);

  // Check existing session on mount
  useEffect(() => {
    const existingUser = authStorage.getUser();
    if (existingUser) {
      setSession(existingUser);
      if (existingUser.full_name) {
        setFullName(existingUser.full_name);
      }
      // If user already logged in and at step 1 or 2, jump to step 3
      fetchProfile()
        .then((profile) => {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.district_name) setDistrict(profile.district_name);
          if (profile.taluka) setTaluka(profile.taluka);
          if (profile.village_city) setVillageCity(profile.village_city);
          if (profile.residency_area) setResidencyArea(profile.residency_area);
          if (profile.age) setAge(profile.age);
          if (profile.gender) setGender(profile.gender);
          if (profile.marital_status) setMaritalStatus(profile.marital_status);
          if (profile.annual_family_income) setIncome(profile.annual_family_income);
          if (profile.caste_category) setCasteCategory(profile.caste_category);
          if (profile.education_level) setEducationLevel(profile.education_level);
          if (profile.occupation_type) setOccupation(profile.occupation_type);
          if (profile.is_pwd !== undefined) setIsPwd(profile.is_pwd);
          if (profile.disability_percentage) setDisabilityPercentage(profile.disability_percentage);
          if (profile.beneficiary_categories && profile.beneficiary_categories.length > 0) {
            setSelectedCategories(profile.beneficiary_categories);
          }
          if (profile.onboarding_step && profile.onboarding_step > 1 && !profile.is_onboarding_completed) {
            setCurrentStep(profile.onboarding_step);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Handler: Step 1 (Welcome & Name)
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const trimmed = fullName.trim();

    if (!trimmed) {
      setErrorMessage('Please enter your full name to get started.');
      return;
    }
    if (trimmed.length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 100) {
      setErrorMessage('Full name cannot exceed 100 characters.');
      return;
    }
    // Check for harmful script tags
    if (/[<>{}]/g.test(trimmed)) {
      setErrorMessage('Name contains invalid characters.');
      return;
    }

    // If citizen is already authenticated, jump to step 3 directly
    if (authStorage.isAuthenticated()) {
      saveOnboardingStep(1, { full_name: trimmed }).catch(() => {});
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  };

  // Handler: Step 2 (Real Authentication)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Please provide a valid email address.');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      if (authMode === 'register') {
        const res = await registerCitizen({
          email: email.trim(),
          password,
          full_name: fullName.trim()
        });
        setSession(res.user);
      } else {
        const res = await loginCitizen({
          email: email.trim(),
          password
        });
        setSession(res.user);
        if (res.user.full_name) {
          setFullName(res.user.full_name);
        }
      }

      // Persist full name if updated
      await saveOnboardingStep(1, { full_name: fullName.trim() });
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Loader for fast testing
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginCitizen({
        email: 'demo-citizen-user'
      });
      setSession(res.user);
      if (!fullName) setFullName('Rohan Sharma');
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMessage('Demo login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Step 3 (Maharashtra Residency)
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await saveOnboardingStep(3, {
        state_code: stateCode,
        is_maharashtra_resident: isMhResident,
        district_name: district,
        taluka: taluka.trim() || undefined,
        village_city: villageCity.trim() || undefined,
        residency_area: residencyArea
      });
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save location details.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Step 4 (Personal & Family Profile)
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await saveOnboardingStep(4, {
        age: Number(age),
        gender,
        marital_status: maritalStatus,
        annual_family_income: Number(income),
        caste_category: casteCategory,
        education_level: educationLevel,
        occupation_type: occupation,
        is_pwd: isPwd,
        disability_percentage: isPwd ? Number(disabilityPercentage) : null
      });
      setCurrentStep(5);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save personal profile.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Category
  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Handler: Step 5 (Beneficiary Categories & Conditional Details)
  const handleStep5Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (selectedCategories.length === 0) {
      setErrorMessage('Please select at least one beneficiary category.');
      setLoading(false);
      return;
    }

    try {
      const studentDetails = selectedCategories.includes('STUDENTS')
        ? {
            course: studentCourse,
            institution_type: studentInstitutionType,
            academic_year: studentYear,
            interests: studentScholarshipInterests
          }
        : null;

      const farmerDetails = selectedCategories.includes('FARMERS')
        ? {
            landholding_category: farmerLandCategory,
            total_acres: Number(farmerAcres),
            irrigation_type: farmerIrrigation,
            crops: farmerCrops.split(',').map((c) => c.trim())
          }
        : null;

      const entrepreneurDetails = selectedCategories.includes('ENTREPRENEURS')
        ? {
            business_stage: entrepreneurStage,
            sector: entrepreneurSector,
            investment_range: entrepreneurInvestment,
            udyam_status: entrepreneurUdyam
          }
        : null;

      const vulnerableDetails = {
        udid_status: isPwd ? udidStatus : undefined,
        disability_type: isPwd ? disabilityType : undefined,
        is_head_of_household: isHeadOfHousehold,
        is_single_mother: isSingleMother,
        shg_member: shgMember
      };

      await saveOnboardingStep(5, {
        beneficiary_categories: selectedCategories,
        student_details: studentDetails,
        farmer_details: farmerDetails,
        entrepreneur_details: entrepreneurDetails,
        vulnerable_details: vulnerableDetails,
        landholding_acres: selectedCategories.includes('FARMERS') ? Number(farmerAcres) : 0.0
      });

      setCurrentStep(6);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save beneficiary parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Wizard Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5 text-gov-blue">
            <Landmark className="w-4 h-4" />
            <span>Citizen Onboarding Wizard</span>
          </span>
          <span className="bg-gov-lightBlue text-gov-blue px-2.5 py-0.5 rounded-full border border-gov-blue/20">
            Step {currentStep} of 6
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gov-blue h-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Step labels */}
        <div className="grid grid-cols-6 gap-1 text-[11px] text-center mt-2 font-medium text-slate-500">
          <span className={currentStep >= 1 ? 'text-gov-blue font-bold' : ''}>Welcome</span>
          <span className={currentStep >= 2 ? 'text-gov-blue font-bold' : ''}>Sign In</span>
          <span className={currentStep >= 3 ? 'text-gov-blue font-bold' : ''}>Residency</span>
          <span className={currentStep >= 4 ? 'text-gov-blue font-bold' : ''}>Profile</span>
          <span className={currentStep >= 5 ? 'text-gov-blue font-bold' : ''}>Eligibility</span>
          <span className={currentStep >= 6 ? 'text-gov-blue font-bold' : ''}>Results</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Action Required</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: WELCOME AND NAME */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gov-blue/10 border border-gov-blue/20 text-gov-blue flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7 text-gov-blue" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome! Let's find schemes for you.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
              Discover Maharashtra government schemes, scholarships, and benefits that match your profile.
            </p>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-5 max-w-md mx-auto pt-2">
            <div>
              <label htmlFor="full_name_input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                What is your full name? <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="full_name_input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gov-blue hover:bg-gov-blue/90 text-white font-semibold rounded-xl shadow-md shadow-gov-blue/20 flex items-center justify-center gap-2 transition"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy Note */}
          <div className="pt-4 border-t border-slate-100 flex items-start gap-3 text-slate-500 text-xs">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Citizen Privacy Guarantee:</strong> We collect your profile information strictly to evaluate eligibility for Maharashtra state and central welfare schemes. Your details are never sold or shared with commercial entities.
            </p>
          </div>

          {/* Already have an account */}
          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-gov-blue font-semibold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      )}

      {/* STEP 2: REAL CITIZEN AUTHENTICATION */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gov-blue/10 text-gov-blue flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-gov-blue" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {authMode === 'register' ? 'Create Your Citizen Account' : 'Sign In to Your Account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Saving your profile allows you to track scheme benefits, bookmark applications, and view instant match results.
            </p>
          </div>

          {/* Toggle Register / Login */}
          <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm mx-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-lg transition ${
                authMode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Citizen (Register)
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg transition ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Existing Account (Login)
            </button>
          </div>

          <form onSubmit={handleStep2Submit} className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rohan.sharma@example.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none transition"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-3 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gov-blue hover:bg-gov-blue/90 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-gov-blue/20 flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <span>Securing Credentials...</span>
                ) : (
                  <>
                    <span>{authMode === 'register' ? 'Register & Continue' : 'Sign In & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Mode */}
          <div className="pt-4 border-t border-slate-100 max-w-md mx-auto text-center space-y-2">
            <p className="text-xs text-slate-500">Need instant testing without setting a password?</p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="text-xs font-semibold text-gov-blue hover:text-gov-blue/80 bg-gov-lightBlue px-3 py-1.5 rounded-lg border border-gov-blue/20 transition inline-flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Use Demo Citizen Profile (Rohan Sharma)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: MAHARASHTRA RESIDENCY & LOCATION */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Maharashtra Domicile & Location</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Where in Maharashtra do you reside?</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              State welfare schemes and district-specific benefits require verified local jurisdiction.
            </p>
          </div>

          <form onSubmit={handleStep3Submit} className="space-y-5">
            {/* Maharashtra Residency Confirmation */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <input
                id="is_mh_resident"
                type="checkbox"
                checked={isMhResident}
                onChange={(e) => setIsMhResident(e.target.checked)}
                className="mt-1 w-4 h-4 text-gov-blue rounded border-slate-300 focus:ring-gov-blue"
              />
              <label htmlFor="is_mh_resident" className="text-xs sm:text-sm text-slate-800 font-medium">
                I am a permanent resident / domicile of <strong>Maharashtra State</strong>.
                <span className="block text-slate-500 text-xs mt-0.5">
                  Qualifies you for state-level DBT scholarships, Ladki Bahin, Shetari Sanman Nidhi, and CMEGP.
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* District Dropdown with all 36 Districts */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maharashtra District <span className="text-rose-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                >
                  {MAHARASHTRA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Taluka / Tehsil */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Taluka / Tehsil
                </label>
                <input
                  type="text"
                  value={taluka}
                  onChange={(e) => setTaluka(e.target.value)}
                  placeholder="e.g. Haveli, Baramati, Karveer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                />
              </div>

              {/* Village or City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Village, Town, or City
                </label>
                <input
                  type="text"
                  value={villageCity}
                  onChange={(e) => setVillageCity(e.target.value)}
                  placeholder="e.g. Pune City, Kolhapur, Baramati"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                />
              </div>

              {/* Area Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Area Classification
                </label>
                <div className="flex gap-2">
                  {['Urban', 'Rural', 'Semi-Urban'].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setResidencyArea(area)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        residencyArea === area
                          ? 'bg-gov-blue text-white border-gov-blue'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-gov-blue hover:bg-gov-blue/90 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md shadow-gov-blue/20 flex items-center gap-2 transition"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: PERSONAL & FAMILY PROFILE */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Personal & Socio-Economic Profile</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Tell us about your background</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Schemes have income ceilings, age criteria, and caste reservations. All data remains private.
            </p>
          </div>

          <form onSubmit={handleStep4Submit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Age (Years) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="TRANSGENDER">Transgender</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Marital Status
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                >
                  <option value="SINGLE">Single / Unmarried</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced / Separated</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>

              {/* Annual Family Income */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Annual Family Income (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {income <= 100000 && '• Below ₹1 Lakh (BPL / Antyodaya benefits)'}
                  {income > 100000 && income <= 250000 && '• Under ₹2.5 Lakhs (Full Scholarship Cap)'}
                  {income > 250000 && income <= 800000 && '• Under ₹8 Lakhs (EBC & Non-Creamy Layer Cap)'}
                  {income > 800000 && '• General income bracket'}
                </span>
              </div>

              {/* Caste / Social Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Social Category / Caste <span className="text-rose-500">*</span>
                </label>
                <select
                  value={casteCategory}
                  onChange={(e) => setCasteCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                >
                  {SOCIAL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Education Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Highest Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                >
                  {EDUCATION_LEVELS.map((ed) => (
                    <option key={ed.value} value={ed.value}>
                      {ed.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occupation */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Occupation / Activity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none"
                >
                  {OCCUPATION_OPTIONS.map((occ) => (
                    <option key={occ.value} value={occ.value}>
                      {occ.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Disability Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">Person with Disability (Divyangjan / PwD)?</span>
                  <p className="text-slate-500 text-xs">Special reservation and assistive schemes available.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPwd(!isPwd)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                    isPwd ? 'bg-gov-blue justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {isPwd && (
                <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700">Disability Percentage:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={disabilityPercentage}
                    onChange={(e) => setDisabilityPercentage(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium"
                  />
                  <span className="text-xs text-slate-500">(40%+ qualifies for state disability pensions)</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="py-2.5 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-gov-blue hover:bg-gov-blue/90 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md shadow-gov-blue/20 flex items-center gap-2 transition"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 5: BENEFICIARY CATEGORIES & CONDITIONAL DETAILS */}
      {currentStep === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target Beneficiary Groups</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Which categories apply to you?</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Select all groups that match your background. We will customize questions to find exact matches.
            </p>
          </div>

          <form onSubmit={handleStep5Submit} className="space-y-6">
            {/* Multi-Select Category Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BENEFICIARY_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-gov-blue bg-gov-lightBlue/40 text-gov-blue shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="font-bold text-xs">{cat.label}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-gov-blue shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">{cat.description}</span>
                  </button>
                );
              })}
            </div>

            {/* CONDITIONAL SUB-FORM: STUDENTS */}
            {selectedCategories.includes('STUDENTS') && (
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <GraduationCap className="w-4 h-4 text-gov-blue" />
                  <span>Student & Higher Education Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Current Course / Stream
                    </label>
                    <input
                      type="text"
                      value={studentCourse}
                      onChange={(e) => setStudentCourse(e.target.value)}
                      placeholder="e.g. Engineering, B.Sc, Diploma"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      College / Institution Type
                    </label>
                    <select
                      value={studentInstitutionType}
                      onChange={(e) => setStudentInstitutionType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="GOVERNMENT">Government Institution</option>
                      <option value="GOVERNMENT_AIDED">Government-Aided College</option>
                      <option value="PRIVATE_UNAIDED">Private / Unaided College</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Academic Year
                    </label>
                    <select
                      value={studentYear}
                      onChange={(e) => setStudentYear(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="1st Year">1st Year / Fresher</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year">Final Year / Postgraduate</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL SUB-FORM: FARMERS */}
            {selectedCategories.includes('FARMERS') && (
              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Tractor className="w-4 h-4 text-emerald-600" />
                  <span>Farmer & Agricultural Land Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Landholding Category
                    </label>
                    <select
                      value={farmerLandCategory}
                      onChange={(e) => setFarmerLandCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="Marginal (< 1 Hectare / 2.5 Acres)">Marginal (&lt; 1 Ha / 2.5 Acres)</option>
                      <option value="Small (1 to 2 Hectares)">Small (1 to 2 Hectares)</option>
                      <option value="Medium/Large (> 2 Hectares)">Medium / Large (&gt; 2 Hectares)</option>
                      <option value="Landless Agricultural Labour">Landless Labourer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Total Land (Acres)
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      value={farmerAcres}
                      onChange={(e) => setFarmerAcres(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Irrigation Facility
                    </label>
                    <select
                      value={farmerIrrigation}
                      onChange={(e) => setFarmerIrrigation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="Rainfed / Dryland">Rainfed / Dryland</option>
                      <option value="Canal / Well Irrigated">Canal / Well Irrigated</option>
                      <option value="Drip / Micro Irrigation">Drip / Micro Irrigation</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL SUB-FORM: ENTREPRENEURS */}
            {selectedCategories.includes('ENTREPRENEURS') && (
              <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <span>Enterprise & Business Details (CMEGP / MSME)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Business Stage
                    </label>
                    <select
                      value={entrepreneurStage}
                      onChange={(e) => setEntrepreneurStage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="Aspiring / Ideation">Aspiring / Ideation</option>
                      <option value="Existing Micro Enterprise">Existing Micro Enterprise</option>
                      <option value="Small Enterprise">Small Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Sector
                    </label>
                    <select
                      value={entrepreneurSector}
                      onChange={(e) => setEntrepreneurSector(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Services / IT & Tech">Services / IT &amp; Tech</option>
                      <option value="Agro-Processing & Dairy">Agro-Processing &amp; Dairy</option>
                      <option value="Retail & Trade">Retail &amp; Trade</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Udyam Registration
                    </label>
                    <select
                      value={entrepreneurUdyam}
                      onChange={(e) => setEntrepreneurUdyam(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="Registered">Registered (Udyam MSME)</option>
                      <option value="Not Registered">Not Registered</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL SUB-FORM: WOMEN & CHILD WELFARE */}
            {selectedCategories.includes('WOMEN') && (
              <div className="p-5 rounded-2xl border border-pink-200 bg-pink-50/50 space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <HeartHandshake className="w-4 h-4 text-pink-600" />
                  <span>Women & Family Welfare (Ladki Bahin & SHG)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      id="head_of_hh"
                      type="checkbox"
                      checked={isHeadOfHousehold}
                      onChange={(e) => setIsHeadOfHousehold(e.target.checked)}
                      className="w-4 h-4 text-pink-600 rounded"
                    />
                    <label htmlFor="head_of_hh" className="text-xs text-slate-700 font-medium">
                      Head of Family / Household
                    </label>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      id="single_mother"
                      type="checkbox"
                      checked={isSingleMother}
                      onChange={(e) => setIsSingleMother(e.target.checked)}
                      className="w-4 h-4 text-pink-600 rounded"
                    />
                    <label htmlFor="single_mother" className="text-xs text-slate-700 font-medium">
                      Single Mother / Widow
                    </label>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      id="shg_member"
                      type="checkbox"
                      checked={shgMember}
                      onChange={(e) => setShgMember(e.target.checked)}
                      className="w-4 h-4 text-pink-600 rounded"
                    />
                    <label htmlFor="shg_member" className="text-xs text-slate-700 font-medium">
                      Mahila Bachat Gat / SHG Member
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="py-2.5 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-gov-blue hover:bg-gov-blue/90 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md shadow-gov-blue/20 flex items-center gap-2 transition"
              >
                <span>Save & Evaluate Matches</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 6: COMPLETION & PERSONALIZED DASHBOARD REDIRECT */}
      {currentStep === 6 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Profile Completed Successfully!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your profile has been deterministically matched against all active Maharashtra State and Central schemes.
            </p>
          </div>

          {/* Profile Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Citizen Profile</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Maharashtra Resident
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Name:</span> <strong>{fullName || 'Rohan Sharma'}</strong>
              </div>
              <div>
                <span className="text-slate-500">District:</span> <strong>{district}</strong>
              </div>
              <div>
                <span className="text-slate-500">Occupation:</span> <strong>{occupation}</strong>
              </div>
              <div>
                <span className="text-slate-500">Income:</span> <strong>₹{income.toLocaleString('en-IN')}/year</strong>
              </div>
              <div>
                <span className="text-slate-500">Category:</span> <strong>{casteCategory}</strong>
              </div>
              <div>
                <span className="text-slate-500">Groups:</span> <strong>{selectedCategories.join(', ')}</strong>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push('/recommendations')}
              className="w-full sm:w-auto py-3.5 px-8 bg-gov-blue hover:bg-gov-blue/90 text-white font-bold rounded-xl shadow-lg shadow-gov-blue/20 flex items-center justify-center gap-2 transition"
            >
              <span>Explore My Personalized Schemes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="w-full sm:w-auto py-3.5 px-5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs transition"
            >
              Edit Profile Parameters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
