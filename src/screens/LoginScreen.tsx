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
    // Field validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required fields', 'Please complete all fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await dynamoDBService.loginUser(email, password);

      if (result.success && result.user) {
        // Create user object with the result data
        const user = {
          id: result.user.id,
          name: result.user.nombre,
          email: result.user.email,
          role: result.user.userType === 'vendor' ? 'Vendor' : 'Client',
          userType: result.user.userType,
          ...result.user, // Includes additional backend fields
        };

        console.log('✅ Login successful, saving user...', result.user);

        // Save session
        await AsyncStorage.setItem('currentUser', JSON.stringify(result.user));
        console.log('💾 User saved in AsyncStorage');

        Alert.alert('Welcome!', `Hello ${result.user.nombre}`);

        // Navigate based on user type
        if (result.user.userType === 'client' || result.user.userType === 'cliente') {
          navigation.navigate('ClientTabs', { user });
        } else if (result.user.userType === 'vendor' || result.user.userType === 'vendedor') {
          navigation.navigate('VendorTabs', { user });
        } else {
          navigation.navigate('ClientTabs', { user });
        }

      } else {
        Alert.alert('Authentication error', result.error || 'Incorrect credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Connection error', 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = () => {
    Alert.alert(
      'Recover password',
      'Enter your email to receive instructions',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => console.log('Password recovery requested') },
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
        {/* Header with Logo */}
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

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="mail-outline" size={20} color="#1a535c" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
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
                placeholder="Password"
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
              Forgot your password?
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
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('CreateAccount')}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>Create new account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
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
