import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { canCreateListing } from '@/utils/permissions';
import { useCreateRequestForm } from './CreateRequest/useCreateRequestForm';
import { useCreateRequestSubmit } from './CreateRequest/useCreateRequestSubmit';
import CreateRequestFormFields from './CreateRequest/CreateRequestFormFields';

interface CreateRequestProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateRequest({ isAuthenticated, onLogout }: CreateRequestProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { districts } = useDistrict();
  const accessCheck = canCreateListing(isAuthenticated);

  useEffect(() => {
    console.log('CreateRequest: проверка верификации ОТКЛЮЧЕНА, требуется только авторизация');
    if (!accessCheck.allowed) {
      toast({
        title: "Доступ ограничен",
        description: accessCheck.message,
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [accessCheck.allowed, accessCheck.message, navigate, toast]);

  const {
    formData,
    images,
    imagePreviews,
    video,
    videoPreview,
    handleInputChange,
    handleDistrictToggle,
    handleImageUpload,
    handleRemoveImage,
    handleVideoUpload,
    handleRemoveVideo,
  } = useCreateRequestForm();

  const { isSubmitting, handleSubmit } = useCreateRequestSubmit(formData, imagePreviews);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Создание запроса</h1>
            <p className="text-muted-foreground">
              Опишите что вам нужно, и поставщики пришлют свои предложения
            </p>
          </div>

          <CreateRequestFormFields
            formData={formData}
            images={images}
            imagePreviews={imagePreviews}
            video={video}
            videoPreview={videoPreview}
            districts={districts}
            isSubmitting={isSubmitting}
            onInputChange={handleInputChange}
            onDistrictToggle={handleDistrictToggle}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            onVideoUpload={handleVideoUpload}
            onRemoveVideo={handleRemoveVideo}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/my-requests')}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
