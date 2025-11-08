import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { dynamoDBService } from '../services/dynamoDBService';
import { UserData } from '../aws-config';

type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  Home: { user: any };
};

type CreateAccountScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateAccount'>;

interface Props {
  navigation: CreateAccountScreenNavigationProp;
}

// Interface local
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
    intereses: 'historia,arte'
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
    handleContinue();
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
    setCurrentStep(1);
  };

  const generateUserId = (): string => {
    const prefix = formData.userType === 'vendor' ? 'Vendedor' : 'Cliente';
    const timestamp = Date.now();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}#${timestamp}${randomNum}`;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Verificar si el email ya existe
      const emailExists = await dynamoDBService.checkEmailExists(formData.email);
      if (emailExists) {
        Alert.alert('Error', 'Este correo electrónico ya está registrado');
        setLoading(false);
        return;
      }

      // Generar userId único
      const userId = generateUserId();

      // Preparar datos para DynamoDB
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

      // Agregar campos específicos según el tipo de usuario
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

      // Guardar en DynamoDB
      const result = await dynamoDBService.createUser(userData);

      if (result.success) {
        Alert.alert(
          '¡Cuenta Creada!', 
          `✅ Tu cuenta se ha creado exitosamente\n\nTu ID: ${userId}`,
          [
            {
              text: 'Ir al Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        
        console.log('📋 DATOS GUARDADOS EN DYNAMODB:', JSON.stringify(userData, null, 2));
        
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

  // Paso 1: Información Personal
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Cuéntanos sobre ti</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>Información Personal</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(value) => handleInputChange('nombre', value)}
            placeholder="Ej: María González"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <View style={styles.phoneContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+52</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={formData.telefono}
              onChangeText={(value) => handleInputChange('telefono', value)}
              placeholder="55 1234 5678"
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
        <Text style={styles.continueButtonText}>Continuar</Text>
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

  // Paso 2: Selección de Rol
  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Selecciona tu Rol</Text>
        <Text style={styles.subtitle}>¿Cómo usarás YOLINK?</Text>
        <Text style={styles.note}>Puedes cambiar esto después</Text>
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
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.roleCard,
            formData.userType === 'client' && styles.roleCardSelected
          ]}
          onPress={() => handleUserTypeSelect('client')}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleEmoji}>👤</Text>
          </View>
          <Text style={styles.roleTitle}>Soy Turista</Text>
          <Text style={styles.roleDescription}>
            Quiero descubrir y comprar en negocios locales
          </Text>
        </TouchableOpacity>
      </View>

      {formData.userType === 'vendor' && (
        <View style={styles.vendorFields}>
          <Text style={styles.sectionLabel}>Información del Negocio</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría *</Text>
            <TextInput
              style={styles.input}
              value={formData.categoria}
              onChangeText={(value) => handleInputChange('categoria', value)}
              placeholder="Ej: Restaurante, Tienda, etc."
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección del Local</Text>
            <TextInput
              style={styles.input}
              value={formData.direccion}
              onChangeText={(value) => handleInputChange('direccion', value)}
              placeholder="Av. Principal 123"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción del Negocio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcion}
              onChangeText={(value) => handleInputChange('descripcion', value)}
              placeholder="Describe tu negocio..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      )}

      {formData.userType === 'client' && (
        <View style={styles.clientFields}>
          <Text style={styles.sectionLabel}>Preferencias</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Intereses (separados por comas)</Text>
            <TextInput
              style={styles.input}
              value={formData.intereses}
              onChangeText={(value) => handleInputChange('intereses', value)}
              placeholder="historia, arte, gastronomía"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={[
          styles.createAccountButton, 
          loading && styles.buttonDisabled,
          (formData.userType === 'vendor' && !formData.categoria) && styles.buttonDisabled
        ]}
        onPress={handleSubmit}
        disabled={loading || (formData.userType === 'vendor' && !formData.categoria)}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createAccountButtonText}>
            Crear Cuenta
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {currentStep === 1 ? renderStep1() : renderStep2()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formSection: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#666',
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
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  continueButton: {
    backgroundColor: '#667eea',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createAccountButton: {
    backgroundColor: '#667eea',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createAccountButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backToLogin: {
    alignItems: 'center',
    padding: 10,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  roleContainer: {
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  roleIcon: {
    marginBottom: 12,
  },
  roleEmoji: {
    fontSize: 40,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  vendorFields: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  clientFields: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
});

export default CreateAccount;