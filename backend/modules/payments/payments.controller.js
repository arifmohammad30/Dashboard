import * as paymentService from './payments.service.js';
import { validateGatewayConfig, validateTestConnection } from './payments.validator.js';

// GET /api/payments/gateways/:providerId?environment=0|1
// Retrieves sanitized gateway configuration for specified provider and environment
export async function getGatewayConfig(req, res) {
  try {
    const providerId = req.params.providerId || req.query.provider || 'razorpay';
    const environment = req.query.environment !== undefined ? Number(req.query.environment) : 0;
    
    const config = await paymentService.getGatewayConfig(providerId, environment);
    return res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch gateway configuration'
    });
  }
}

// PUT /api/payments/gateways/:providerId
// Saves/updates the payment gateway configuration for the selected environment
export async function updateGatewayConfig(req, res) {
  try {
    const providerId = req.params.providerId || req.body.provider || 'razorpay';
    const validation = validateGatewayConfig(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    const updated = await paymentService.updateGatewayConfig(providerId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Payment gateway configuration saved successfully',
      data: updated
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to save gateway configuration'
    });
  }
}

// POST /api/payments/gateways/:providerId/test-connection
// Tests connectivity using server-stored credentials for the specified environment
export async function testConnection(req, res) {
  try {
    const providerId = req.params.providerId || req.body.provider || 'razorpay';
    const validation = validateTestConnection(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0]
      });
    }

    const environment = Number(req.body.environment);
    const result = await paymentService.testConnection(providerId, environment);

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to test gateway connection'
    });
  }
}
