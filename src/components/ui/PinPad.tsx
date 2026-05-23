import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface PinPadProps {
  onComplete: (pin: string) => void;
  error?: string;
}

export function PinPad({ onComplete, error }: PinPadProps) {
  const [pin, setPin] = useState('');

  const handlePress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 6) {
        onComplete(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const renderDot = (index: number) => {
    const filled = index < pin.length;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          filled && styles.dotFilled,
          error && styles.dotError,
        ]}
      />
    );
  };

  const renderButton = (digit: string) => (
    <TouchableOpacity
      key={digit}
      style={styles.button}
      onPress={() => handlePress(digit)}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>{digit}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* PIN dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4, 5].map(renderDot)}
      </View>

      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Numpad */}
      <View style={styles.numpad}>
        <View style={styles.row}>
          {renderButton('1')}
          {renderButton('2')}
          {renderButton('3')}
        </View>
        <View style={styles.row}>
          {renderButton('4')}
          {renderButton('5')}
          {renderButton('6')}
        </View>
        <View style={styles.row}>
          {renderButton('7')}
          {renderButton('8')}
          {renderButton('9')}
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.buttonText}>C</Text>
          </TouchableOpacity>
          {renderButton('0')}
          <TouchableOpacity style={styles.button} onPress={handleDelete} activeOpacity={0.7}>
            <Text style={styles.deleteText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  dotError: {
    borderColor: Colors.dark.destructive,
    backgroundColor: Colors.dark.destructive,
  },
  errorText: {
    color: Colors.dark.destructive,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  numpad: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  deleteText: {
    fontSize: 24,
    color: Colors.dark.text,
  },
});