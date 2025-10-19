import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

# Example: loading your own data
# df = pd.read_csv('your_data.csv')
# X = df[['feature1', 'feature2', 'feature3']].values
# y = df['target'].values

np.random.seed(42)
X = np.random.rand(1000, 5)  # 1000 samples, 5 input features
# Define some relationship for outputs
y = (X[:, 0] * 2 + X[:, 1] * 0.5 - X[:, 2] + np.random.randn(1000) * 0.1 > 0.5).astype(int)


# Split into train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Optional: scale data for better training
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)



# Example: neural network with 2 hidden layers
model = Sequential([
    Dense(64, input_dim=X_train.shape[1], activation='relu'),  # first hidden layer
    Dense(32, activation='relu'),                              # second hidden layer
    Dense(1, activation='sigmoid')                             # output layer (for binary classification)
])

model.compile(optimizer='adam', loss='mse', metrics=['accuracy'])
# For regression: loss='mse' (mean squared error)

history = model.fit(X_train, y_train, epochs=50, batch_size=32, validation_split=0.2)

loss, acc = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {acc:.3f}")

# Predictions
y_pred = model.predict(X_test)
