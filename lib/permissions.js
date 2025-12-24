// Middleware to check permissions
export function checkPermission(userRole, requiredPermission) {
    const permissions = {
        admin: [
            'manage_products',
            'manage_users',
            'manage_orders',
            'view_analytics',
            'manage_settings',
            'delete_products',
            'edit_products',
            'add_products',
            'manage_inventory',
            'manage_customers'
        ],
        manager: [
            'manage_products',
            'manage_orders',
            'view_analytics',
            'edit_products',
            'add_products',
            'manage_inventory'
        ],
        user: [
            'view_products',
            'place_orders',
            'manage_wishlist',
            'view_profile',
            'edit_profile'
        ]
    };

    return permissions[userRole]?.includes(requiredPermission) || false;
}

// Check multiple permissions
export function hasPermissions(userRole, requiredPermissions) {
    return requiredPermissions.every(permission =>
        checkPermission(userRole, permission)
    );
}

// Get all permissions for a role
export function getRolePermissions(userRole) {
    const permissions = {
        admin: [
            'manage_products',
            'manage_users',
            'manage_orders',
            'view_analytics',
            'manage_settings',
            'delete_products',
            'edit_products',
            'add_products',
            'manage_inventory',
            'manage_customers'
        ],
        manager: [
            'manage_products',
            'manage_orders',
            'view_analytics',
            'edit_products',
            'add_products',
            'manage_inventory'
        ],
        user: [
            'view_products',
            'place_orders',
            'manage_wishlist',
            'view_profile',
            'edit_profile'
        ]
    };

    return permissions[userRole] || [];
}

export default {
    checkPermission,
    hasPermissions,
    getRolePermissions
};
