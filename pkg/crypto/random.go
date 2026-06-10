package crypto

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
)

// GeneratePreimage creates a cryptographically secure 32-byte random preimage
// This is used for HTLC escrow contracts in the Lightning Network
func GeneratePreimage() (string, error) {
	preimage := make([]byte, 32)
	if _, err := rand.Read(preimage); err != nil {
		return "", err
	}
	return hex.EncodeToString(preimage), nil
}

// GeneratePaymentHash creates a SHA256 hash of the preimage for the payment hash
func GeneratePaymentHash(preimage string) (string, error) {
	preimageBytes, err := hex.DecodeString(preimage)
	if err != nil {
		return "", err
	}

	hash := sha256.Sum256(preimageBytes)
	return hex.EncodeToString(hash[:]), nil
}

// ValidatePreimage checks if a preimage is valid 32-byte hex string
func ValidatePreimage(preimage string) bool {
	if len(preimage) != 64 {
		return false
	}

	_, err := hex.DecodeString(preimage)
	return err == nil
}
