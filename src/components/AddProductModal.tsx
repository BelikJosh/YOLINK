// components/AddProductModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onAddProduct: (productData: any) => void;
}

const CATEGORIES = [
  'Electrónicos',
  'Ropa',
  'Hogar',
  'Deportes',
  'Juguetes',
  'Libros',
  'Salud y Belleza',
  'Automotriz',
  'Otros'
];

const AddProductModal: React.FC<AddProductModalProps> = ({
  visible,
  onClose,
  onAddProduct
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    stock: '',
    imagen: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }
    if (!formData.descripcion.trim()) {
      Alert.alert('Error', 'La descripción del producto es requerida');
      return;
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }
    if (!formData.categoria) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      Alert.alert('Error', 'El stock debe ser un número válido');
      return;
    }

    setLoading(true);

    try {
      await onAddProduct({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseFloat(formData.precio),
        categoria: formData.categoria,
        stock: parseInt(formData.stock),
        imagen: formData.imagen.trim() || undefined
      });

      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        stock: '',
        imagen: ''
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: '',
      stock: '',
      imagen: ''
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetForm}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Agregar Producto</Text>
          <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Producto *</Text>
            <TextInput
              style={styles.input}
              value={formData.nombre}
              onChangeText={text => setFormData(prev => ({ ...prev, nombre: text }))}
              placeholder="Ej: iPhone 13 Pro"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcion}
              onChangeText={text => setFormData(prev => ({ ...prev, descripcion: text }))}
              placeholder="Describe tu producto..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Precio *</Text>
              <TextInput
                style={styles.input}
                value={formData.precio}
                onChangeText={text => setFormData(prev => ({ ...prev, precio: text.replace(/[^0-9.]/g, '') }))}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                value={formData.stock}
                onChangeText={text => setFormData(prev => ({ ...prev, stock: text.replace(/[^0-9]/g, '') }))}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.categoria === category && styles.categoryButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, categoria: category }))}
                >
                  <Text style={[
                    styles.categoryText,
                    formData.categoria === category && styles.categoryTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>URL de Imagen (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={formData.imagen}
              onChangeText={text => setFormData(prev => ({ ...prev, imagen: text }))}
              placeholder="https://ejemplo.com/imagen.jpg"
              autoCapitalize="none"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Agregando...</Text>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Agregar Producto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flex: 1,
    padding: 20,
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  categoriesContainer: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  categoryButtonSelected: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddProductModal;