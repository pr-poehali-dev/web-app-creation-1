import bcrypt

def test_bcrypt_hash():
    """Test bcrypt password hashing and verification"""
    
    # Original password
    password = "123456"
    print(f"Original password: {password}")
    
    # Create hash
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    print(f"\nGenerated hash: {hashed.decode('utf-8')}")
    
    # Test verification with correct password
    is_correct = bcrypt.checkpw(password_bytes, hashed)
    print(f"\nVerification with correct password '123456': {is_correct}")
    
    # Test verification with incorrect password
    wrong_password = "wrong_password"
    wrong_password_bytes = wrong_password.encode('utf-8')
    is_incorrect = bcrypt.checkpw(wrong_password_bytes, hashed)
    print(f"Verification with incorrect password '{wrong_password}': {is_incorrect}")
    
    # Summary
    print("\n" + "="*50)
    if is_correct and not is_incorrect:
        print("SUCCESS: bcrypt is working correctly!")
    else:
        print("FAILED: bcrypt is not working as expected")
    print("="*50)

if __name__ == "__main__":
    test_bcrypt_hash()
