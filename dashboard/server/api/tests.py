from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

class CapturedImageViewTests(APITestCase):
    def test_captured_image_upload_response(self):
        """
        Ensure that the response includes 'class' and 'confidence' fields.
        """
        # Create a dummy image
        image = Image.new('RGB', (100, 100), color='red')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        image_file = SimpleUploadedFile(
            "test_image.jpg", 
            image_io.getvalue(), 
            content_type="image/jpeg"
        )
        
        url = reverse('capture_image')  # Make sure this matches your URL name
        data = {
            'device_id': 'test_device_001',
            'image': image_file
        }
        
        # Mocking the classification to avoid loading the actual model/weights which might be missing or heavy
        # However, since we can't easily mock inner methods without patching, we'll try to run it. 
        # If the model is missing, it might fail. 
        # Ideally, we should mock `CapturedImageView.classify_image`.
        
        from unittest.mock import patch
        
        # Patch the classify_image method of the view
        # Note: We need to patch where it's used or the class method itself.
        # Since it's an instance method, we can patch it on the class or correct import.
        
        with patch('api.views.CapturedImageView.classify_image') as mock_classify:
            # Mock return values: animal_type, confidence, annotated_image_data
            mock_classify.return_value = ('Elephant', 0.95, None)
            
            response = self.client.post(url, data, format='multipart')
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertIn('class', response.data)
            self.assertIn('confidence', response.data)
            self.assertEqual(response.data['class'], 'Elephant')
            self.assertEqual(response.data['confidence'], 0.95)

