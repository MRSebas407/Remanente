from rest_framework import serializers
from .models import User, RegisterUser, Role, Specialism, Adviser


class RegisterUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegisterUser
        exclude = ['user']


class UserSerializer(serializers.ModelSerializer):
    register_profile = RegisterUserSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'register_profile']


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    names = serializers.CharField()
    last_name = serializers.CharField()
    document = serializers.CharField()
    phone = serializers.CharField()
    photo = serializers.ImageField(required=False)
    gender = serializers.ChoiceField(choices=['M', 'F'], default='M')
    role_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True)
    specialism_id = serializers.IntegerField(required=False, allow_null=True)
    signature = serializers.ImageField(required=False)

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        role_ids = validated_data.pop('role_ids', [])
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            password=make_password(validated_data['password'])
        )
        register_data = {
            'user': user,
            'names': validated_data['names'],
            'last_name': validated_data['last_name'],
            'document': validated_data['document'],
            'phone': validated_data['phone'],
            'gender': validated_data.get('gender', 'M'),
        }
        if 'photo' in validated_data:
            register_data['photo'] = validated_data['photo']
        register_user = RegisterUser.objects.create(**register_data)
        adviser = Adviser.objects.create(
            profile=register_user,
            specialism_id=validated_data.get('specialism_id'),
            signature=validated_data.get('signature'),
        )
        if role_ids:
            adviser.roles.set(role_ids)
        return {'user': user, 'register_user': register_user, 'adviser': adviser}


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'


class SpecialismSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialism
        fields = '__all__'


class AdviserSerializer(serializers.ModelSerializer):
    profile = RegisterUserSerializer(read_only=True)
    roles = RoleSerializer(many=True, read_only=True)
    specialism = SpecialismSerializer(read_only=True)
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    names = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    document = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    gender = serializers.ChoiceField(write_only=True, choices=['M', 'F'], default='M')
    photo = serializers.ImageField(write_only=True, required=False)
    role_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True)
    specialism_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Adviser
        fields = '__all__'

    def validate_username(self, value):
        if self.instance:
            user = self.instance.profile.user
            if User.objects.filter(username=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError('El usuario ya existe')
        elif User.objects.filter(username=value).exists():
            raise serializers.ValidationError('El usuario ya existe')
        return value

    def validate_document(self, value):
        if self.instance:
            if RegisterUser.objects.filter(document=value).exclude(pk=self.instance.profile.pk).exists():
                raise serializers.ValidationError('La cédula ya está registrada')
        elif RegisterUser.objects.filter(document=value).exists():
            raise serializers.ValidationError('La cédula ya está registrada')
        return value

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        role_ids = validated_data.pop('role_ids', [])
        user = User.objects.create(
            username=validated_data.pop('username'),
            email=validated_data.pop('email'),
            password=make_password(validated_data.pop('password')),
        )
        register_user = RegisterUser.objects.create(
            user=user,
            names=validated_data.pop('names'),
            last_name=validated_data.pop('last_name'),
            document=validated_data.pop('document'),
            phone=validated_data.pop('phone'),
            gender=validated_data.pop('gender', 'M'),
            photo=validated_data.pop('photo', None),
        )
        validated_data.pop('is_active', None)
        adviser = Adviser.objects.create(profile=register_user, is_active=True, **validated_data)
        if role_ids:
            adviser.roles.set(role_ids)
        return adviser

    def update(self, instance, validated_data):
        profile = instance.profile
        if 'names' in validated_data:
            profile.names = validated_data.pop('names')
        if 'last_name' in validated_data:
            profile.last_name = validated_data.pop('last_name')
        if 'document' in validated_data:
            profile.document = validated_data.pop('document')
        if 'phone' in validated_data:
            profile.phone = validated_data.pop('phone')
        if 'gender' in validated_data:
            profile.gender = validated_data.pop('gender')
        if 'photo' in validated_data:
            profile.photo = validated_data.pop('photo')
        profile.save()

        if 'signature' in validated_data:
            instance.signature = validated_data.pop('signature')
        if 'role_ids' in validated_data:
            role_ids = validated_data.pop('role_ids')
            instance.roles.set(role_ids)
        if 'specialism_id' in validated_data:
            instance.specialism_id = validated_data.pop('specialism_id')
        if 'is_active' in validated_data:
            instance.is_active = validated_data.pop('is_active')
        instance.save()
        return instance


class AdviserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    document = serializers.CharField(source='profile.document')
    phone = serializers.CharField(source='profile.phone')

    class Meta:
        model = Adviser
        fields = ['id', 'full_name', 'roles', 'document', 'phone', 'is_active', 'assigned_count', 'signature']

    def get_full_name(self, obj):
        return f'{obj.profile.names} {obj.profile.last_name}'


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class ProfileSerializer(serializers.ModelSerializer):
    names = serializers.CharField(source='profile.names')
    last_name = serializers.CharField(source='profile.last_name')
    document = serializers.CharField(source='profile.document')
    phone = serializers.CharField(source='profile.phone')
    gender = serializers.ChoiceField(source='profile.gender', choices=['M', 'F'])
    photo = serializers.ImageField(source='profile.photo', required=False, allow_null=True)
    signature = serializers.ImageField(required=False, allow_null=True)
    theme = serializers.ChoiceField(source='profile.theme', choices=['light', 'dark'])

    class Meta:
        model = Adviser
        fields = ['id', 'names', 'last_name', 'document', 'phone', 'gender', 'photo', 'signature', 'theme']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        if 'signature' in validated_data:
            instance.signature = validated_data.pop('signature')
        instance.save()
        return instance
