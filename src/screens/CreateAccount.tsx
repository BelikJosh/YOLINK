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
  Home: { user: any };
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
  lat: string;
  lng: string;
  intereses: string;
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
    lat: '19.4326',
    lng: '-99.1332',
    intereses: 'historia,arte,gastronomía'
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
      Alert.alert('Error', 'Por favor ingresa tu nombre completo');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return false;
    }

    if (!formData.contraseña) {
      Alert.alert('Error', 'Por favor ingresa una contraseña');
      return false;
    }

    if (formData.contraseña.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.contraseña !== formData.confirmarContraseña) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
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
    }
  };

  const generateUserId = (): string => {
    const prefix = formData.userType === 'vendor' ? 'Vendedor' : 'Cliente';
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
          lat: location.lat.toString(),
          lng: location.lng.toString()
        }));
      }
    });
  };

  const handleSubmit = async () => {
    if (formData.userType === 'vendor') {
      if (!formData.categoria.trim()) {
        Alert.alert('Error', 'Por favor ingresa la categoría de tu negocio');
        return;
      }
      if (!formData.direccion.trim()) {
        Alert.alert('Error', 'Por favor selecciona la ubicación de tu negocio');
        return;
      }
    }

    setLoading(true);

    try {
      const emailExists = await dynamoDBService.checkEmailExists(formData.email);
      if (emailExists) {
        Alert.alert('Error', 'Este correo electrónico ya está registrado');
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
            lat: parseFloat(formData.lat) || 19.4326,
            lng: parseFloat(formData.lng) || -99.1332
          },
          horario: {
            apertura: '08:00',
            cierre: '22:00',
            dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
          },
          telefono: formData.telefono,
          descripcion: formData.descripcion
        });
      } else {
        Object.assign(userData, {
          comprasRealizadas: 0,
          totalGastado: 0,
          ubicacionActual: {
            lat: parseFloat(formData.lat) || 19.4326,
            lng: parseFloat(formData.lng) || -99.1332
          },
          preferencias: {
            intereses: formData.intereses.split(',').map(i => i.trim()),
            radioBusqueda: 5
          }
        });
      }

      const result = await dynamoDBService.createUser(userData);

      if (result.success) {
        Alert.alert(
          '¡Cuenta Creada!', 
          `✅ Tu cuenta se ha creado exitosamente\n\nBienvenido a YOLINK`,
          [
            {
              text: 'Ir al Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        
        console.log('📋 DATOS GUARDADOS:', JSON.stringify(userData, null, 2));
        
      } else {
        Alert.alert('Error', `❌ Error al crear la cuenta: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', '❌ Error al conectar con la base de datos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // PASO 1: Información Personal
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Crear Cuenta</Text>
        <Text style={styles.subtitle}>Cuéntanos sobre ti</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(value) => handleInputChange('nombre', value)}
            placeholder="Ej: María González"
            placeholderTextColor="#95a5a6"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="#95a5a6"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <View style={styles.phoneContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇲🇽 +52</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={formData.telefono}
              onChangeText={(value) => handleInputChange('telefono', value)}
              placeholder="55 1234 5678"
              placeholderTextColor="#95a5a6"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={formData.contraseña}
              onChangeText={(value) => handleInputChange('contraseña', value)}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#95a5a6"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeButtonText}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmar Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={formData.confirmarContraseña}
              onChangeText={(value) => handleInputChange('confirmarContraseña', value)}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#95a5a6"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeButtonText}>
                {showConfirmPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.continueButton, (!formData.nombre || !formData.email || !formData.contraseña) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!formData.nombre || !formData.email || !formData.contraseña}
      >
        <Text style={styles.continueButtonText}>Continuar →</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backToLogin}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.backToLoginText}>
          ¿Ya tienes cuenta? <Text style={styles.loginLink}>Iniciar Sesión</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // PASO 2: Selección de Rol
  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 Selecciona tu Rol</Text>
        <Text style={styles.subtitle}>¿Cómo usarás YOLINK?</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
        </View>
      </View>

      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[
            styles.roleCard,
            formData.userType === 'vendor' && styles.roleCardSelected
          ]}
          onPress={() => handleUserTypeSelect('vendor')}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleEmoji}>🏪</Text>
          </View>
          <Text style={styles.roleTitle}>Soy Vendedor</Text>
          <Text style={styles.roleDescription}>
            Vendo productos o tengo un negocio local
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Ideal para negocios</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.roleCard,
            formData.userType === 'client' && styles.roleCardSelected
          ]}
          onPress={() => handleUserTypeSelect('client')}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleEmoji}>🌎</Text>
          </View>
          <Text style={styles.roleTitle}>Soy Turista</Text>
          <Text style={styles.roleDescription}>
            Quiero descubrir y comprar en negocios locales
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Explora México</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // PASO 3: Información Adicional
  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {formData.userType === 'vendor' ? '🏪 Tu Negocio' : '🌟 Tus Preferencias'}
        </Text>
        <Text style={styles.subtitle}>Completa tu perfil</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
        </View>
      </View>

      {formData.userType === 'vendor' ? (
        <View style={styles.vendorFields}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría del Negocio *</Text>
            <TextInput
              style={styles.input}
              value={formData.categoria}
              onChangeText={(value) => handleInputChange('categoria', value)}
              placeholder="Ej: Restaurante, Tienda de artesanías, Café"
              placeholderTextColor="#95a5a6"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ubicación del Negocio *</Text>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={handleLocationPick}
            >
              <View style={styles.mapButtonContent}>
                <Text style={styles.mapIcon}>📍</Text>
                <View style={styles.mapTextContainer}>
                  <Text style={styles.mapButtonText}>
                    {formData.direccion || 'Seleccionar ubicación en el mapa'}
                  </Text>
                  {formData.direccion && (
                    <Text style={styles.mapButtonSubtext}>
                      Toca para cambiar ubicación
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción del Negocio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcion}
              onChangeText={(value) => handleInputChange('descripcion', value)}
              placeholder="Describe tu negocio: qué vendes, qué te hace especial..."
              placeholderTextColor="#95a5a6"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              {formData.descripcion.length}/200 caracteres
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.clientFields}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tus Intereses</Text>
            <Text style={styles.helperText}>
              Selecciona tus intereses para recomendaciones personalizadas
            </Text>
            <TextInput
              style={styles.input}
              value={formData.intereses}
              onChangeText={(value) => handleInputChange('intereses', value)}
              placeholder="historia, arte, gastronomía, compras"
              placeholderTextColor="#95a5a6"
            />
          </View>

          <View style={styles.interestChips}>
            {['historia', 'arte', 'gastronomía', 'compras', 'cultura', 'naturaleza'].map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.chip,
                  formData.intereses.toLowerCase().includes(interest.toLowerCase()) && styles.chipActive
                ]}
                onPress={() => {
                  const currentInterests = formData.intereses.split(',').map(i => i.trim()).filter(i => i);
                  if (currentInterests.includes(interest)) {
                    const newInterests = currentInterests.filter(i => i !== interest);
                    handleInputChange('intereses', newInterests.join(', '));
                  } else {
                    handleInputChange('intereses', [...currentInterests, interest].join(', '));
                  }
                }}
              >
                <Text style={[
                  styles.chipText,
                  formData.intereses.toLowerCase().includes(interest.toLowerCase()) && styles.chipTextActive
                ]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
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
          <Text style={styles.createAccountButtonText}>
            🎉 Crear Mi Cuenta
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          Al crear una cuenta, aceptas nuestros{' '}
          <Text style={styles.termsLink}>Términos y Condiciones</Text>
          {' '}y{' '}
          <Text style={styles.termsLink}>Política de Privacidad</Text>
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
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4ecdc4',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a535c',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 200,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1a535c',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#c1f9e1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1a535c',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: '#c1f9e1',
    padding: 16,
    borderWidth: 2,
    borderColor: '#c1f9e1',
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#1a535c',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  eyeButtonText: {
    fontSize: 20,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  continueButton: {
    backgroundColor: '#ff6b6b',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#f7fff9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createAccountButton: {
    backgroundColor: '#ff6b6b',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    padding: 10,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  loginLink: {
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
  roleContainer: {
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#c1f9e1',
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: '#4ecdc4',
    backgroundColor: '#c1f9e1',
  },
  roleIcon: {
    marginBottom: 12,
  },
  roleEmoji: {
    fontSize: 48,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    borderWidth: 2,
    borderColor: '#c1f9e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mapIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  mapTextContainer: {
    flex: 1,
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
  interestChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    backgroundColor: '#c1f9e1',
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