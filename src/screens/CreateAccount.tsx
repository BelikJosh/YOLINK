import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { UserData } from '../aws-config';
import { dynamoDBService } from '../services/dynamoDBService';

type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  MapLocationPicker: {
    onLocationSelected: (location: {
      address: string;
      lat: number;
      lng: number;
    }) => void;
  };
  ClientTabs: { user: any };
  VendorTabs: { user: any };
};

type CreateAccountScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateAccount'>;

interface Props {
  navigation: CreateAccountScreenNavigationProp;
}

interface FormData {
  userType: 'client' | 'vendor';
  nombre: string;
  email: string;
  contraseña: string;
  confirmarContraseña: string;
  telefono: string;
  categoria: string;
  direccion: string;
  descripcion: string;
  lat: number;
  lng: number;
  intereses: string[];
}

const CreateAccount: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    userType: 'client',
    nombre: '',
    email: '',
    contraseña: '',
    confirmarContraseña: '',
    telefono: '',
    categoria: '',
    direccion: '',
    descripcion: '',
    lat: 19.4326,
    lng: -99.1332,
    intereses: []
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const availableInterests = ['History', 'Art', 'Food', 'Shopping', 'Culture', 'Nature'];

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      intereses: prev.intereses.includes(interest)
        ? prev.intereses.filter(i => i !== interest)
        : [...prev.intereses, interest]
    }));
  };

  const handleUserTypeSelect = (userType: 'client' | 'vendor') => {
    setFormData(prev => ({
      ...prev,
      userType
    }));
    setCurrentStep(3);
  };

  const validateStep1 = (): boolean => {
    if (!formData.nombre.trim()) {
      Alert.alert('Required Field', 'Please enter your full name');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    if (!formData.contraseña) {
      Alert.alert('Required Field', 'Please enter a password');
      return false;
    }

    if (formData.contraseña.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return false;
    }

    if (formData.contraseña !== formData.confirmarContraseña) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      navigation.goBack();
    }
  };

  const generateUserId = (): string => {
    const prefix = formData.userType === 'vendor' ? 'VENDOR' : 'CLIENT';
    const timestamp = Date.now();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}#${timestamp}${randomNum}`;
  };

  const handleLocationPick = () => {
    navigation.navigate('MapLocationPicker', {
      onLocationSelected: (location) => {
        setFormData(prev => ({
          ...prev,
          direccion: location.address,
          lat: location.lat,
          lng: location.lng
        }));
      }
    });
  };

  const handleSubmit = async () => {
    if (formData.userType === 'vendor') {
      if (!formData.categoria.trim()) {
        Alert.alert('Required Field', 'Please enter your business category');
        return;
      }
      if (!formData.direccion.trim()) {
        Alert.alert('Required Field', 'Please select your business location');
        return;
      }
    }

    setLoading(true);

    try {
      const emailExists = await dynamoDBService.checkEmailExists(formData.email);
      if (emailExists) {
        Alert.alert('Email In Use', 'This email address is already registered');
        setLoading(false);
        return;
      }

      const userId = generateUserId();

      const userData: UserData = {
        id: userId,
        userType: formData.userType,
        nombre: formData.nombre,
        email: formData.email,
        password: formData.contraseña,
        telefono: formData.telefono,
        walletOpenPay: `wallet_${formData.userType}_${Date.now()}`,
        fechaRegistro: new Date().toISOString(),
        rating: 0,
        reseñasCount: 0
      };

      if (formData.userType === 'vendor') {
        Object.assign(userData, {
          ventasRealizadas: 0,
          totalGanado: 0,
          categoria: formData.categoria,
          ubicacion: {
            direccion: formData.direccion,
            lat: formData.lat,
            lng: formData.lng
          },
          horario: {
            apertura: '09:00',
            cierre: '18:00',
            dias: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          },
          descripcion: formData.descripcion || 'Local business'
        });
      } else {
        Object.assign(userData, {
          comprasRealizadas: 0,
          totalGastado: 0,
          ubicacionActual: {
            lat: formData.lat,
            lng: formData.lng
          },
          preferencias: {
            intereses: formData.intereses.length > 0 ? formData.intereses : ['History', 'Art', 'Food'],
            radioBusqueda: 5
          }
        });
      }

      const result = await dynamoDBService.createUser(userData);

      if (result.success) {
        Alert.alert(
          'Account Created',
          'Your account has been created successfully',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        
        console.log('User created:', JSON.stringify(userData, null, 2));
      } else {
        Alert.alert('Error', `Could not create account: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Error connecting to database');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Personal Information
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#1a535c" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Step 1 of 3</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.progressActive]} />
        <View style={styles.progressSegment} />
        <View style={styles.progressSegment} />
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#4ecdc4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.nombre}
              onChangeText={(value) => handleInputChange('nombre', value)}
              placeholder="e.g., Maria Gonzalez"
              placeholderTextColor="#95a5a6"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#4ecdc4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="youremail@example.com"
              placeholderTextColor="#95a5a6"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#4ecdc4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.telefono}
              onChangeText={(value) => handleInputChange('telefono', value)}
              placeholder="55 1234 5678"
              placeholderTextColor="#95a5a6"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#4ecdc4" style={styles.inputIcon} />
            <TextInput
              style={styles.inputPassword}
              value={formData.contraseña}
              onChangeText={(value) => handleInputChange('contraseña', value)}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#95a5a6"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#95a5a6" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#4ecdc4" style={styles.inputIcon} />
            <TextInput
              style={styles.inputPassword}
              value={formData.confirmarContraseña}
              onChangeText={(value) => handleInputChange('confirmarContraseña', value)}
              placeholder="Repeat your password"
              placeholderTextColor="#95a5a6"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#95a5a6" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.continueButton, (!formData.nombre || !formData.email || !formData.contraseña) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!formData.nombre || !formData.email || !formData.contraseña}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#f7fff9" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backToLogin}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.backToLoginText}>
          Already have an account? <Text style={styles.loginLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // STEP 2: Account Type Selection
  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#1a535c" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Account Type</Text>
          <Text style={styles.subtitle}>Step 2 of 3</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.progressActive]} />
        <View style={[styles.progressSegment, styles.progressActive]} />
        <View style={styles.progressSegment} />
      </View>

      <Text style={styles.sectionTitle}>How will you use YOLINK?</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[
            styles.roleCard,
            formData.userType === 'vendor' && styles.roleCardSelected
          ]}
          onPress={() => handleUserTypeSelect('vendor')}
        >
          <View style={styles.roleIconContainer}>
            <Ionicons name="storefront" size={48} color={formData.userType === 'vendor' ? '#ff6b6b' : '#4ecdc4'} />
          </View>
          <Text style={styles.roleTitle}>Vendor</Text>
          <Text style={styles.roleDescription}>
            I have a local business and want to sell my products
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>For Businesses</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.roleCard,
            formData.userType === 'client' && styles.roleCardSelected
          ]}
          onPress={() => handleUserTypeSelect('client')}
        >
          <View style={styles.roleIconContainer}>
            <Ionicons name="compass" size={48} color={formData.userType === 'client' ? '#ff6b6b' : '#4ecdc4'} />
          </View>
          <Text style={styles.roleTitle}>Customer</Text>
          <Text style={styles.roleDescription}>
            I want to discover and buy from local businesses
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>For Explorers</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // STEP 3: Additional Information
  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#1a535c" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {formData.userType === 'vendor' ? 'Your Business' : 'Your Preferences'}
          </Text>
          <Text style={styles.subtitle}>Step 3 of 3</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.progressActive]} />
        <View style={[styles.progressSegment, styles.progressActive]} />
        <View style={[styles.progressSegment, styles.progressActive]} />
      </View>

      {formData.userType === 'vendor' ? (
        <View style={styles.vendorFields}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Category</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="pricetag-outline" size={20} color="#4ecdc4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.categoria}
                onChangeText={(value) => handleInputChange('categoria', value)}
                placeholder="e.g., Restaurant, Cafe, Crafts"
                placeholderTextColor="#95a5a6"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Location</Text>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={handleLocationPick}
            >
              <Ionicons name="location" size={24} color="#4ecdc4" />
              <View style={styles.mapTextContainer}>
                <Text style={styles.mapButtonText}>
                  {formData.direccion || 'Select location on map'}
                </Text>
                {formData.direccion && (
                  <Text style={styles.mapButtonSubtext}>Tap to change</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={styles.textArea}
                value={formData.descripcion}
                onChangeText={(value) => handleInputChange('descripcion', value)}
                placeholder="Describe your business..."
                placeholderTextColor="#95a5a6"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.clientFields}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Interests</Text>
            <Text style={styles.helperText}>
              Select the topics you're interested in
            </Text>
            <View style={styles.interestChips}>
              {availableInterests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.chip,
                    formData.intereses.includes(interest) && styles.chipActive
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[
                    styles.chipText,
                    formData.intereses.includes(interest) && styles.chipTextActive
                  ]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={[
          styles.createAccountButton, 
          loading && styles.buttonDisabled,
          (formData.userType === 'vendor' && (!formData.categoria || !formData.direccion)) && styles.buttonDisabled
        ]}
        onPress={handleSubmit}
        disabled={loading || (formData.userType === 'vendor' && (!formData.categoria || !formData.direccion))}
      >
        {loading ? (
          <ActivityIndicator color="#f7fff9" />
        ) : (
          <>
            <Text style={styles.createAccountButtonText}>Create My Account</Text>
            <Ionicons name="checkmark-circle" size={20} color="#f7fff9" />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.termsLink}>Terms and Conditions</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fff9',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#95a5a6',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#c1f9e1',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#4ecdc4',
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a535c',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#c1f9e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a535c',
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a535c',
  },
  eyeButton: {
    padding: 8,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    width: '100%',
    minHeight: 100,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a535c',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  continueButtonText: {
    color: '#f7fff9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 15,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  createAccountButtonText: {
    color: '#f7fff9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  backToLogin: {
    alignItems: 'center',
    padding: 7,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  loginLink: {
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a535c',
    marginBottom: 24,
    textAlign: 'center',
  },
  roleContainer: {
    gap: 16,
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#c1f9e1',
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: '#4ecdc4',
    backgroundColor: '#f7fff9',
  },
  roleIconContainer: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#f7fff9',
    fontSize: 12,
    fontWeight: '600',
  },
  vendorFields: {
    marginBottom: 20,
  },
  clientFields: {
    marginBottom: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#c1f9e1',
    borderRadius: 12,
    padding: 16,
  },
  mapTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  mapButtonText: {
    fontSize: 16,
    color: '#1a535c',
    fontWeight: '500',
  },
  mapButtonSubtext: {
    fontSize: 12,
    color: '#4ecdc4',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 12,
  },
  interestChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#c1f9e1',
  },
  chipActive: {
    backgroundColor: '#4ecdc4',
    borderColor: '#4ecdc4',
  },
  chipText: {
    color: '#1a535c',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#f7fff9',
    fontWeight: '600',
  },
  termsContainer: {
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4ecdc4',
    fontWeight: '600',
  },
});

export default CreateAccount;