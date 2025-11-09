import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../navigation/Appnavigator';
import { dynamoDBService } from '../services/dynamoDBService';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // Validación de campos
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos');
      return;
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Email inválido', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      const result = await dynamoDBService.loginUser(email, password);

      if (result.success && result.user) {
        // Guardar sesión
        await AsyncStorage.setItem('currentUser', JSON.stringify(result.user));

        // Navegar según tipo de usuario
        const navigateTo = result.user.userType === 'vendor' ? 'VendorTabs' : 'ClientTabs';
        
        navigation.navigate(navigateTo, { 
          user: {
            ...result.user,
            name: result.user.nombre,
            role: result.user.userType === 'vendor' ? 'Vendedor' : 'Cliente'
          }
        });

        Alert.alert('Bienvenido', `Hola ${result.user.nombre}`);
      } else {
        Alert.alert('Error de autenticación', result.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar contraseña',
      'Ingresa tu correo electrónico para recibir instrucciones',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => console.log('Password recovery requested') }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header con Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../Yolink.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>YOLINK</Text>
          <Text style={styles.tagline}>Where local commerce beats</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="mail-outline" size={20} color="#1a535c" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#95a5a6"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="lock-closed-outline" size={20} color="#1a535c" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#95a5a6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color="#95a5a6" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#f7fff9" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('CreateAccount')}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>Crear nueva cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al iniciar sesión, aceptas nuestros{' '}
            <Text style={styles.footerLink}>Términos de Servicio</Text>
            {' '}y{' '}
            <Text style={styles.footerLink}>Política de Privacidad</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fff9',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#c1f9e1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 4,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#4ecdc4',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#1a535c',
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#c1f9e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4ecdc4',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#95a5a6',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#f7fff9',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#c1f9e1',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#95a5a6',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#c1f9e1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c1f9e1',
    marginBottom: 24,
  },
  registerButtonText: {
    color: '#1a535c',
    fontSize: 16,
    fontWeight: '600',
  },
  demoAccounts: {
    backgroundColor: '#c1f9e1',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4ecdc4',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a535c',
  },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  demoText: {
    fontSize: 13,
    color: '#1a535c',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#4ecdc4',
    fontWeight: '600',
  },
});

export default LoginScreen;