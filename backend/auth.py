from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import models, database
import bcrypt
from typing import Optional


SECRET_KEY="your_secret_key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_WEEKS=24


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(
        bytes(plain_password, encoding="utf-8"),
        bytes(hashed_password, encoding="utf-8"),
    )

def get_password_hash(password):
    hashed = bcrypt.hashpw(
        bytes(password, encoding="utf-8"),
        bcrypt.gensalt(),
    )
    return hashed.decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    expire = datetime.now(timezone.utc) + timedelta(weeks=REFRESH_TOKEN_EXPIRE_WEEKS)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth_2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(database.AuthUser).filter(database.AuthUser.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user



router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", response_model=models.TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Check if credentials are valid
    db_user = db.query(database.AuthUser).filter(database.AuthUser.username == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Immediately delete any existing refresh tokens for this user
    db.query(database.AuthRefreshToken).filter(database.AuthRefreshToken.user_id == db_user.id).delete()
    db.commit()

    # Create new access and refresh tokens
    access_token = create_access_token({"sub": str(db_user.id), "username": db_user.username})
    refresh_token = create_refresh_token({"sub": str(db_user.id)})

    # Create and link the refresh token (linked to user relationship-wise)
    refresh_token_obj = database.AuthRefreshToken(user_id=db_user.id, token=refresh_token)
    db_user.refresh_tokens.append(refresh_token_obj)
    db.add(refresh_token_obj)

    # Ensure user profile is created and assigned properly
    if not db_user.profile:
        db_user.profile = database.UserProfile()
        db.add(db_user.profile)

    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=models.TokenResponse)
def register(user_form: models.UserCreateInput, db: Session = Depends(get_db)):
    # Check if email or username already exists
    if db.query(database.AuthUser).filter_by(email=user_form.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if db.query(database.AuthUser).filter_by(username=user_form.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    # Hash the password
    hashed_password = get_password_hash(user_form.password)

    # Create user instance
    db_user = database.AuthUser(email=user_form.email, username=user_form.username, hashed_password=hashed_password)

    # Create and assign the user profile via relationship
    db_user.profile = database.UserProfile()  # user_id auto-linked by ORM

    # Create refresh token object and attach to user relationship
    refresh_token = create_refresh_token({"sub": str(db_user.id)})
    refresh_token_obj = database.AuthRefreshToken(token=refresh_token)
    db_user.refresh_tokens.append(refresh_token_obj)

    # Persist everything in one go
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create access token
    access_token = create_access_token({"sub": str(db_user.id), "username": db_user.username})

    response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",  # Set to strict to prevent CSRF attacks (only works with both frontend and backend on the same domain)
        secure=True         # Set to True in production with HTTPS!
    )
    return response


@router.post("/login", response_model=models.TokenResponse)
def login(user_form: models.UserLoginInput, db: Session = Depends(get_db)):
    # Check if credentials are valid
    db_user = db.query(database.AuthUser).filter(database.AuthUser.username == user_form.username).first()
    if not db_user or not verify_password(user_form.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Immediately delete any existing refresh tokens for this user
    db.query(database.AuthRefreshToken).filter(database.AuthRefreshToken.user_id == db_user.id).delete()
    db.commit()

    # Create new access and refresh tokens
    access_token = create_access_token({"sub": str(db_user.id), "username": db_user.username})
    refresh_token = create_refresh_token({"sub": str(db_user.id)})

    # Create and link the refresh token (linked to user relationship-wise)
    refresh_token_obj = database.AuthRefreshToken(user_id=db_user.id, token=refresh_token)
    db_user.refresh_tokens.append(refresh_token_obj)
    db.add(refresh_token_obj)

    # Ensure user profile is created and assigned properly
    if not db_user.profile:
        db_user.profile = database.UserProfile()
        db.add(db_user.profile)

    db.commit()

    # Set the refresh token cookie and return access token
    response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",  # CSRF protection
        secure=True         # Enable in HTTPS environments
    )
    return response


@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        db.query(database.AuthRefreshToken).filter(database.AuthRefreshToken.token == refresh_token).delete()
        db.commit()
    response = JSONResponse(content={"msg": "Logged out"})
    response.delete_cookie("refresh_token")
    return response


@router.post("/refresh", response_model=models.TokenResponse)
def refresh_token(request: Request, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing refresh token")

    # Verify token in db
    db_refresh_token = db.query(database.AuthRefreshToken).filter(database.AuthRefreshToken.token == refresh_token).first()
    if not db_refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")


    access_token = create_access_token({"sub": str(db_refresh_token.user_id), "username": db_refresh_token.user.username})
    response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",  # Set to strict to prevent CSRF attacks (only works with both frontend and backend on the same domain)
        secure=True         # Set to True in production with HTTPS!
    )
    return response


@router.post("/google/callback", response_model=models.TokenResponse)
def google_callback(data: models.GoogleCallbackInput, db: Session = Depends(get_db)):
    # 🔵 MOCK: Here you’d call Google’s API to exchange `code` for user info
    # For now let’s pretend the Google user id is just the code
    google_id = data.code  
    user = db.query(database.AuthUser).filter(database.AuthUser.google_id == google_id).first()

    if user:
        # Existing user: clear old tokens and create new ones
        db.query(database.AuthRefreshToken).filter_by(user_id=user.id).delete()

        refresh_token = create_refresh_token({"sub": str(user.id)})
        refresh_token_obj = database.AuthRefreshToken(token=refresh_token)
        user.refresh_tokens.append(refresh_token_obj)

        # Ensure user profile is created and assigned properly
        if not user.profile:
            user.profile = database.UserProfile()
            db.add(user.profile)

        db.commit()

        access_token = create_access_token({"sub": str(user.id), "username": user.username})

        response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite="strict",
            secure=True  # Required in production with HTTPS
        )
        return response
    else:
        # New user, issue short-lived access token for picking username
        temp_token = create_access_token(
            {"sub": google_id}, expires_delta=timedelta(minutes=5)
        )
        response = JSONResponse(content={"access_token": temp_token, "token_type": "bearer"})
        return response
