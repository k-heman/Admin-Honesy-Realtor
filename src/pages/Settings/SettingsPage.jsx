import { useState, useEffect } from 'react';
import { settingsService } from '../../services/firestoreService';
import toast from 'react-hot-toast';
import { FiSave, FiPhone, FiMail, FiMapPin, FiGlobe, FiMessageCircle, FiFacebook, FiInstagram, FiLinkedin } from 'react-icons/fi';

const defaultSettings = {
  companyName: 'Honesty Realtors',
  phone: '',
  email: '',
  address: '',
  mapsLink: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  linkedin: '',
};

function FieldWithIcon({ icon: Icon, label, name, type = 'text', placeholder, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', flexShrink: 0 }} size={15} />
        <input
          className="form-control"
          style={{ paddingLeft: 36 }}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await settingsService.get();
        if (data) setSettings({ ...defaultSettings, ...data });
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.save(settings);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header__left">
            <div className="skeleton skeleton-title" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ marginBottom: 16 }}>
            <div className="skeleton skeleton-title" style={{ width: '25%', marginBottom: 16 }} />
            <div className="form-row">
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1>Website Settings</h1>
          <p>Configure company information shown on the public website</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-sections">

          {/* Company Information */}
          <div className="card">
            <div className="settings-section-title">Company Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-control" name="companyName" value={settings.companyName} onChange={handleChange} placeholder="Honesty Realtors" />
              </div>
              <div className="form-row">
                <FieldWithIcon icon={FiPhone} label="Phone Number" name="phone" placeholder="+91 9876543210" value={settings.phone} onChange={handleChange} />
                <FieldWithIcon icon={FiMail} label="Email Address" name="email" type="email" placeholder="contact@honestyrealtor.com" value={settings.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <div style={{ position: 'relative' }}>
                  <FiMapPin style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} size={15} />
                  <textarea
                    className="form-control"
                    style={{ paddingLeft: 36 }}
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                    placeholder="Full company address"
                    rows={3}
                  />
                </div>
              </div>
              <FieldWithIcon icon={FiMapPin} label="Google Maps Link" name="mapsLink" placeholder="https://maps.google.com/..." value={settings.mapsLink} onChange={handleChange} />
            </div>
          </div>

          {/* Contact Channels */}
          <div className="card">
            <div className="settings-section-title">Contact Channels</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FieldWithIcon icon={FiMessageCircle} label="WhatsApp Number" name="whatsapp" placeholder="+91 9876543210" value={settings.whatsapp} onChange={handleChange} />
            </div>
          </div>

          {/* Social Media */}
          <div className="card">
            <div className="settings-section-title">Social Media</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FieldWithIcon icon={FiFacebook} label="Facebook URL" name="facebook" placeholder="https://facebook.com/honestyrealtor" value={settings.facebook} onChange={handleChange} />
              <FieldWithIcon icon={FiInstagram} label="Instagram URL" name="instagram" placeholder="https://instagram.com/honestyrealtor" value={settings.instagram} onChange={handleChange} />
              <FieldWithIcon icon={FiLinkedin} label="LinkedIn URL" name="linkedin" placeholder="https://linkedin.com/company/honestyrealtor" value={settings.linkedin} onChange={handleChange} />
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              <FiSave size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
